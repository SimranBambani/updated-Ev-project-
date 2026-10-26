import React, { useState, useContext, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomerContext } from '../../context/CustomerContext';
import { MapContext } from '../../context/MapContext';
import { stationService } from '../../services/stationService';
import { PageHeader } from '../../components/common/layout/PageHeader';
import { Card } from '../../components/common/cards/Card';
import { Button } from '../../components/common/buttons/Button';
import { SearchBar } from '../../components/common/forms/SearchBar';
import { Modal } from '../../components/common/modal/Modal';
import { StatusBadge } from '../../components/common/badge/StatusBadge';
import { MapContainer } from '../../components/map/MapContainer';
import { calculateDistance, formatDistance } from '../../utils/distanceCalculator';
import { formatDuration } from '../../utils/estimationEngine';
import {
  FiMapPin,
  FiZap,
  FiClock,
  FiNavigation,
  FiInfo,
  FiCalendar,
  FiStar,
} from 'react-icons/fi';
import { toast } from 'react-toastify';

export const CustomerDashboard = () => {
  const { stations, vehicles } = useContext(CustomerContext);
  const { userLocation, selectedStation, selectStationForMap } = useContext(MapContext);
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeStationModal, setActiveStationModal] = useState(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [recommendedStations, setRecommendedStations] = useState(stations || []);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const recommendationLatitude = Number(userLocation.latitude).toFixed(3);
  const recommendationLongitude = Number(userLocation.longitude).toFixed(3);
  const selectedVehicle = vehicles.find(
    (vehicle) => String(vehicle.vehicle_id || vehicle._id) === selectedVehicleId
  );

  useEffect(() => {
    if (!selectedVehicleId && vehicles.length > 0) {
      setSelectedVehicleId(String(vehicles[0].vehicle_id || vehicles[0]._id));
    }
  }, [selectedVehicleId, vehicles]);

  useEffect(() => {
    let current = true;
    setRecommendationsLoading(true);

    stationService
      .getAll(Number(recommendationLatitude), Number(recommendationLongitude), selectedVehicleId || null)
      .then((result) => {
        if (current) setRecommendedStations(result);
      })
      .catch((error) => {
        console.error('Failed to load personalized station recommendations', error);
        if (current) {
          toast.error('Could not refresh station recommendations. Showing the latest available station list.');
        }
      })
      .finally(() => {
        if (current) setRecommendationsLoading(false);
      });

    return () => {
      current = false;
    };
  }, [recommendationLatitude, recommendationLongitude, selectedVehicleId]);

  // Rank stations using the backend's queue-aware score; fall back to distance and live capacity.
  const stationsWithDetails = useMemo(() => {
    return (recommendedStations || [])
      .map((stn) => {
        const dist = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          stn.latitude,
          stn.longitude
        );

        const estimatedWait = stn.waitingTime ?? null;
        return {
          ...stn,
          distanceKm: dist,
          formattedDistance: formatDistance(dist),
          waitingMinutes: estimatedWait,
          formattedWaiting: estimatedWait == null ? 'Estimate unavailable' : formatDuration(estimatedWait),
          recommendationScore:
            stn.recommendationScore ??
            (dist * 2 + (estimatedWait ?? 0) * 1.5 + (stn.availableSlots > 0 ? 0 : 20)),
        };
      })
      .sort((a, b) => {
        return a.recommendationScore - b.recommendationScore;
      });
  }, [recommendedStations, userLocation]);

  const filteredStations = useMemo(() => {
    return stationsWithDetails.filter(
      (s) =>
        s.stationName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.address?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [stationsWithDetails, searchTerm]);

  const handleBookSlotClick = useCallback(
    (station) => {
      navigate('/customer/bookings', { state: { preselectedStation: station } });
    },
    [navigate]
  );

  const handleNavigateClick = useCallback((station) => {
    toast.info(`GPS Navigation route to ${station.stationName} calculated!`);
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="EV Station Locator & Dashboard"
        description="Find nearby active charging hubs, check real-time slot waiting times, and reserve fast charging"
        actions={
          <Button
            variant="primary"
            icon={FiCalendar}
            onClick={() => navigate('/customer/bookings')}
          >
            Book Charging Slot
          </Button>
        }
      />

      {/* Minimal Google Maps Spatial Grid Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FiMapPin className="text-primary-600" /> Interactive Station Spatial Grid
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            {userLocation.locationSource === 'fallback' ? 'Fallback Location' : 'Live GPS Location'}:{' '}
            <strong className="text-slate-800">
              {userLocation.city} ({userLocation.latitude ? userLocation.latitude.toFixed(3) : '23.023'}°, {userLocation.longitude ? userLocation.longitude.toFixed(3) : '72.571'}°)
            </strong>
          </span>
        </div>

        <MapContainer
          stations={filteredStations}
          userLocation={userLocation}
          selectedStation={selectedStation}
          onSelectStation={(stn) => {
            selectStationForMap(stn);
            setActiveStationModal(stn);
          }}
        />
      </div>

      {/* Station Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            Vehicle for estimate
            <select
              value={selectedVehicleId}
              onChange={(event) => setSelectedVehicleId(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              aria-label="Vehicle for station recommendation"
            >
              {vehicles.length === 0 && <option value="">Default EV profile</option>}
              {vehicles.map((vehicle) => (
                <option key={vehicle.vehicle_id || vehicle._id} value={vehicle.vehicle_id || vehicle._id}>
                  {vehicle.vehicleNumber || vehicle.vehicleModel || 'My vehicle'}
                </option>
              ))}
            </select>
          </label>
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search station by name, address, or city..."
          />
          <div className="text-xs text-slate-500 font-medium">
            {recommendationsLoading ? 'Updating recommendations…' : 'Stations ranked for your trip:'}{' '}
            <strong className="text-slate-900">{filteredStations.length}</strong>
          </div>
        </div>

        {stationsWithDetails.length > 0 && (
          <div className="rounded-2xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-950">
            <strong>Best match: {stationsWithDetails[0].stationName}</strong>
            <span className="ml-2 text-primary-800">
              Ranked by distance, queue, availability, and{' '}
              {selectedVehicle?.vehicleNumber || selectedVehicle?.vehicleModel || 'default EV profile'}.
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStations.map((stn) => {
            const hasSlots = stn.availableSlots > 0;
            const isBestMatch = stn._id === stationsWithDetails[0]?._id;

            return (
              <Card
                key={stn._id}
                hover
                className={`flex flex-col justify-between border-2 transition ${
                  selectedStation?._id === stn._id ? 'border-primary-500 ring-2 ring-primary-500/20' : ''
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary-600 text-white font-bold flex items-center justify-center text-xl shadow-md shadow-primary-600/20">
                      <FiZap />
                    </div>
                    <div className="flex items-center gap-2">
                      {isBestMatch && (
                        <span className="rounded-full bg-primary-100 px-2.5 py-1 text-[10px] font-bold text-primary-700">
                          BEST MATCH
                        </span>
                      )}
                      <StatusBadge status={stn.status || 'Active'} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-base font-bold text-slate-900 leading-tight">
                      {stn.stationName}
                    </h4>
                    <span className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                      <FiStar className="fill-current" /> {stn.avgRating || 4.8}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 flex items-center gap-1 mb-4">
                    <FiMapPin className="text-primary-600 shrink-0" /> {stn.address}, {stn.city}
                  </p>

                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs mb-4">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Distance</span>
                      <strong className="text-slate-900 text-xs flex items-center gap-1 mt-0.5">
                        <FiNavigation className="text-primary-600" /> {stn.formattedDistance}
                      </strong>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Queue Waiting</span>
                      <strong className={`text-xs flex items-center gap-1 mt-0.5 ${hasSlots ? 'text-emerald-600' : 'text-amber-600'}`}>
                        <FiClock /> {stn.formattedWaiting}
                      </strong>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Charge Estimate</span>
                      <strong className="text-slate-900 text-xs flex items-center gap-1 mt-0.5">
                        <FiZap className="text-primary-600" />
                        {stn.estimatedChargingTime == null ? 'Unavailable' : formatDuration(stn.estimatedChargingTime)}
                      </strong>
                    </div>

                    <div className="col-span-2 pt-2 border-t border-slate-200/60 flex justify-between items-center">
                      <span className="text-slate-500">Available Slots:</span>
                      <strong className={hasSlots ? 'text-emerald-600 font-extrabold' : 'text-rose-600 font-extrabold'}>
                        {stn.availableSlots} / {stn.totalSlots} Slots Free
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={FiInfo}
                    onClick={() => setActiveStationModal(stn)}
                  >
                    View Details
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={FiZap}
                    onClick={() => handleBookSlotClick(stn)}
                  >
                    Book Slot
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Station Details Modal */}
      {activeStationModal && (
        <Modal
          isOpen={!!activeStationModal}
          onClose={() => setActiveStationModal(null)}
          title={activeStationModal.stationName}
        >
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Full Address:</span>
                <strong className="text-slate-800">{activeStationModal.address}, {activeStationModal.city}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Live GPS Distance:</span>
                <strong className="text-primary-600">{activeStationModal.formattedDistance}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Queue Waiting Time:</span>
                <strong className="text-emerald-600">{activeStationModal.formattedWaiting}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pricing Rate:</span>
                <strong className="text-slate-900 font-bold">{activeStationModal.pricingPerKWh || '₹15.00'} / kWh</strong>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                icon={FiNavigation}
                onClick={() => handleNavigateClick(activeStationModal)}
              >
                GPS Navigation
              </Button>
              <Button
                variant="primary"
                icon={FiZap}
                onClick={() => {
                  const stn = activeStationModal;
                  setActiveStationModal(null);
                  handleBookSlotClick(stn);
                }}
              >
                Proceed to Book Slot
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
