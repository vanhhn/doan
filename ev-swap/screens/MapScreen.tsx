import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  RefreshControl,
  Alert,
  Dimensions,
  Linking,
  Platform,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Location from "expo-location";
import { useStations } from "../hooks/useApi";
import type { Station } from "../types";
import { useTheme, useI18n } from "../contexts";
import {
  Colors,
  Spacing,
  BorderRadius,
  FontSizes,
  FontWeights,
} from "../theme";
import type { RootStackParamList } from "../navigation.types";

interface StationCardProps {
  station: Station;
  onSelect: (station: Station) => void;
  isDark: boolean;
}

const StationCard: React.FC<StationCardProps> = ({
  station,
  onSelect,
  isDark,
}) => {
  const isAvailable = station.availableBatteries > 0;
  const statusIcon = isAvailable ? "🟢" : "🔴";
  const statusText = isAvailable ? "Có sẵn" : "Hết pin";

  return (
    <TouchableOpacity
      onPress={() => onSelect(station)}
      style={[
        styles.stationCard,
        {
          backgroundColor: isDark ? Colors.dark.surface : Colors.light.surface,
          borderLeftWidth: 4,
          borderLeftColor: isAvailable
            ? Colors.light.success
            : Colors.light.error,
        },
      ]}
      activeOpacity={0.7}
    >
      <View style={styles.stationInfo}>
        <View style={styles.stationHeader}>
          <Text
            style={[
              styles.stationName,
              {
                color: isDark ? Colors.dark.onSurface : Colors.light.onSurface,
              },
            ]}
          >
            {station.name}
          </Text>
          <Text style={styles.statusIcon}>{statusIcon}</Text>
        </View>
        <Text
          style={[
            styles.stationAddress,
            {
              color: isDark
                ? Colors.dark.textSecondary
                : Colors.light.textSecondary,
            },
          ]}
        >
          📍 {station.address}
        </Text>
        <Text
          style={[
            styles.stationDistance,
            {
              color: isDark
                ? Colors.dark.textSecondary
                : Colors.light.textSecondary,
            },
          ]}
        >
          🚗 {station.distance.toFixed(1)} km • {statusText}
        </Text>
      </View>
      <View style={styles.stationAvailability}>
        <Text
          style={[
            styles.availabilityCount,
            {
              color: isAvailable
                ? isDark
                  ? Colors.dark.primary
                  : Colors.light.primary
                : Colors.light.error,
            },
          ]}
        >
          {station.availableBatteries}/{station.totalSlots}
        </Text>
        <Text
          style={[
            styles.availabilityLabel,
            {
              color: isDark
                ? Colors.dark.textSecondary
                : Colors.light.textSecondary,
            },
          ]}
        >
          Pin có sẵn
        </Text>
      </View>
    </TouchableOpacity>
  );
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Hàm tính khoảng cách giữa 2 điểm GPS (Haversine formula)
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Radius of Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Tọa độ GPS giả định cho các trạm (vì database không có)
const STATION_COORDINATES: { [key: number]: { lat: number; lng: number } } = {
  1: { lat: 21.0063, lng: 105.8433 }, // PTIT Ha Noi
  2: { lat: 16.0471, lng: 108.2068 }, // BKDN Da Nang
  3: { lat: 21.0078, lng: 105.8252 }, // Vincom Tran Duy Hung
  4: { lat: 16.0544, lng: 108.2022 }, // Lotte Mart Da Nang
  5: { lat: 21.0285, lng: 105.785 }, // BigC Thang Long
  6: { lat: 16.0408, lng: 108.2163 }, // Aeon Mall Da Nang
};

const MapScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { t } = useI18n();
  const isDark = theme === "dark";
  const mapRef = useRef<MapView>(null);

  // Use real API data for stations
  const { stations, isLoading, error, refetch } = useStations();

  // Location state
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const [locationLoading, setLocationLoading] = useState<boolean>(true);

  // Get user's current location
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        setLocationPermission(status === "granted");

        if (status === "granted") {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setUserLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
          console.log("📍 User location:", location.coords);
        } else {
          Alert.alert(
            "Quyền truy cập vị trí",
            "Cần quyền truy cập vị trí để tính khoảng cách đến các trạm"
          );
        }
      } catch (error) {
        console.error("Error getting location:", error);
      } finally {
        setLocationLoading(false);
      }
    })();
  }, []);

  const handleSelectStation = (station: {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  }) => {
    Alert.alert("🗺️ Dẫn đường", `Bạn muốn đi đến ${station.name}?`, [
      {
        text: "Hủy",
        style: "cancel",
      },
      {
        text: "Mở Google Maps",
        onPress: () => {
          // Use address for better navigation
          const destination = encodeURIComponent(station.address);
          const label = encodeURIComponent(station.name);

          const url = Platform.select({
            ios: `maps://app?daddr=${destination}&q=${label}`,
            android: `google.navigation:q=${destination}`,
          });

          Linking.openURL(url!).catch(() => {
            // Fallback to web URL
            const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
            Linking.openURL(webUrl);
          });
        },
      },
    ]);
  };

  const handleMarkerPress = (station: {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  }) => {
    handleSelectStation(station);
  };

  // Tính khoảng cách và sắp xếp các trạm
  const stationsWithDistance = stations
    .map((station) => {
      const coords = STATION_COORDINATES[station.id];
      let distance = 0;

      if (userLocation && coords) {
        distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          coords.lat,
          coords.lng
        );
      } else {
        // Fallback to random distance if no GPS
        distance = Math.random() * 10;
      }

      return {
        id: station.id.toString(),
        name: station.name,
        address: station.location,
        distance: distance,
        availableBatteries: station.availableSlots,
        totalSlots: station.totalSlots,
        latitude: coords?.lat || 0,
        longitude: coords?.lng || 0,
      };
    })
    .sort((a, b) => a.distance - b.distance); // Sắp xếp theo khoảng cách gần nhất

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark
            ? Colors.dark.background
            : Colors.light.background,
        },
      ]}
    >
      {/* Map Area */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: userLocation?.latitude || 21.0285,
            longitude: userLocation?.longitude || 105.8542,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          }}
          showsUserLocation={true}
          showsMyLocationButton={true}
          showsCompass={true}
        >
          {/* User location marker */}
          {userLocation && (
            <Marker
              coordinate={{
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
              }}
              title="Vị trí của bạn"
              description="Bạn đang ở đây"
              pinColor="blue"
            />
          )}

          {/* Station markers */}
          {stationsWithDistance.map((station) => (
            <Marker
              key={station.id}
              coordinate={{
                latitude: station.latitude,
                longitude: station.longitude,
              }}
              title={station.name}
              description={`${station.distance.toFixed(1)} km • ${
                station.availableBatteries
              }/${station.totalSlots} pin`}
              pinColor={station.availableBatteries > 0 ? "green" : "red"}
              onPress={() => handleMarkerPress(station)}
            />
          ))}
        </MapView>
      </View>

      {/* Station List */}
      <View style={styles.listContainer}>
        <Text
          style={[
            styles.listTitle,
            { color: isDark ? Colors.dark.onSurface : Colors.light.onSurface },
          ]}
        >
          {t("map.nearbyStations")}
        </Text>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text
              style={[
                styles.loadingText,
                {
                  color: isDark
                    ? Colors.dark.textSecondary
                    : Colors.light.textSecondary,
                },
              ]}
            >
              🔄 Đang tải danh sách trạm...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: Colors.light.error }]}>
              ⚠️ {error}
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={refetch}>
              <Text style={styles.retryButtonText}>🔄 Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={stationsWithDistance}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <StationCard
                station={item}
                onSelect={handleSelectStation}
                isDark={isDark}
              />
            )}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={refetch}
                tintColor={
                  theme === "dark" ? Colors.dark.primary : Colors.light.primary
                }
              />
            }
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Text
                  style={[
                    styles.emptyText,
                    {
                      color: isDark
                        ? Colors.dark.textSecondary
                        : Colors.light.textSecondary,
                    },
                  ]}
                >
                  📍 Không có trạm nào gần đây
                </Text>
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Spacing.xl,
  },
  mapContainer: {
    height: Dimensions.get("window").height * 0.4,
    position: "relative",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  listContainer: {
    flex: 1,
    padding: Spacing.md,
  },
  listTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.md,
  },
  stationCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  stationInfo: {
    flex: 1,
  },
  stationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs / 2,
  },
  stationName: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    flex: 1,
  },
  statusIcon: {
    fontSize: FontSizes.base,
  },
  stationAddress: {
    fontSize: FontSizes.sm,
    marginBottom: Spacing.xs / 2,
  },
  stationDistance: {
    fontSize: FontSizes.sm,
  },
  stationAvailability: {
    alignItems: "flex-end",
    marginLeft: Spacing.md,
  },
  availabilityCount: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
  },
  availabilityLabel: {
    fontSize: FontSizes.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  loadingText: {
    fontSize: FontSizes.base,
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  errorText: {
    fontSize: FontSizes.base,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  retryButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  emptyText: {
    fontSize: FontSizes.base,
    textAlign: "center",
  },
});

export default MapScreen;
