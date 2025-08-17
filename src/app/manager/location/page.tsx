'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EditIcon from '@mui/icons-material/Edit';
import BusinessIcon from '@mui/icons-material/Business';
import PublicIcon from '@mui/icons-material/Public';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import HomeFilledIcon from '@mui/icons-material/HomeFilled';
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard';
import { useToast } from '@/context/ToastContext';
import Loader from '@/components/LottieLoader';

interface Office {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
}

interface GraphQLResponse<T> {
    data?: T;
    errors?: Array<{ message: string }>;
}

interface OfficeLocationData {
    getAllOfficeLocations: Office[];
}

interface CreateOfficeData {
    createOfficeLocation: Office;
}

interface UpdateOfficeData {
    updateOfficeLocation: Office;
}

const LocationManager = () => {
    const [officeLocation, setOfficeLocation] = useState<Office | null>(null);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [form, setForm] = useState<{ name: string; latitude: string; longitude: string }>({
        name: '',
        latitude: '',
        longitude: ''
    });
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [gettingLocation, setGettingLocation] = useState<boolean>(false);
    const [hasChanges, setHasChanges] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const { showToast } = useToast();
    const router = useRouter();

    const executeGraphQL = async <T,>(query: string, variables: Record<string, any> = {}): Promise<T> => {
        const response = await fetch('/api/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query, variables })
        });

        const result: GraphQLResponse<T> = await response.json();

        if (result.errors) {
            throw new Error(result.errors[0]?.message || 'GraphQL error');
        }

        if (!result.data) {
            throw new Error('No data returned');
        }

        return result.data;
    };

    const fetchOfficeLocation = async (): Promise<void> => {
        try {
            setLoading(true);

            const query = `
        query GetAllOfficeLocations {
          getAllOfficeLocations {
            id
            name
            latitude
            longitude
          }
        }
      `;

            const data = await executeGraphQL<OfficeLocationData>(query);
            const offices = data.getAllOfficeLocations;

            if (offices.length > 0) {
                const office = offices[0];
                setOfficeLocation(office);
                setForm({
                    name: office.name,
                    latitude: office.latitude.toString(),
                    longitude: office.longitude.toString()
                });
            } else {
                setOfficeLocation(null);
                setForm({ name: '', latitude: '', longitude: '' });
                setIsEditing(true);
            }
        } catch (error) {
            console.error('Error fetching office location:', error);
            setOfficeLocation(null);
            setForm({ name: '', latitude: '', longitude: '' });
            setIsEditing(true);
            showToast('Failed to load office location', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOfficeLocation();
    }, []);

    const handleInputChange = (field: string, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (!hasChanges) {
            setHasChanges(true);
            showToast('You have unsaved changes', 'warning');
        }
    };

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            showToast('Geolocation is not supported by this browser', 'error');
            return;
        }

        setGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setForm(prev => ({
                    ...prev,
                    latitude: latitude.toFixed(6),
                    longitude: longitude.toFixed(6)
                }));
                setHasChanges(true);
                setGettingLocation(false);
                showToast('Current location retrieved successfully!', 'success');
            },
            (error) => {
                setGettingLocation(false);
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        showToast('Location access denied by user', 'error');
                        break;
                    case error.POSITION_UNAVAILABLE:
                        showToast('Location information is unavailable', 'error');
                        break;
                    case error.TIMEOUT:
                        showToast('Location request timed out', 'error');
                        break;
                    default:
                        showToast('An unknown error occurred while retrieving location', 'error');
                        break;
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    };

    const handleSave = async (): Promise<void> => {
        if (!form.name.trim()) {
            showToast('Office name is required', 'error');
            return;
        }

        const lat = parseFloat(form.latitude);
        const lng = parseFloat(form.longitude);

        if (isNaN(lat) || isNaN(lng)) {
            showToast('Please enter valid numbers for latitude and longitude', 'error');
            return;
        }

        if (lat < -90 || lat > 90) {
            showToast('Latitude must be between -90 and 90', 'error');
            return;
        }

        if (lng < -180 || lng > 180) {
            showToast('Longitude must be between -180 and 180', 'error');
            return;
        }

        try {
            setSaving(true);
            setError(null);

            let result: Office;

            if (officeLocation) {
                const updateMutation = `
          mutation UpdateOfficeLocation($id: String!, $data: UpdateOfficeLocationInput!) {
            updateOfficeLocation(id: $id, data: $data) {
              id
              name
              latitude
              longitude
            }
          }
        `;

                const updateData = await executeGraphQL<UpdateOfficeData>(updateMutation, {
                    id: officeLocation.id,
                    data: {
                        name: form.name.trim(),
                        latitude: lat,
                        longitude: lng
                    }
                });

                result = updateData.updateOfficeLocation;
            } else {
                const createMutation = `
          mutation CreateOfficeLocation($data: CreateOfficeLocationInput!) {
            createOfficeLocation(data: $data) {
              id
              name
              latitude
              longitude
            }
          }
        `;

                const createData = await executeGraphQL<CreateOfficeData>(createMutation, {
                    data: {
                        name: form.name.trim(),
                        latitude: lat,
                        longitude: lng
                    }
                });

                result = createData.createOfficeLocation;
            }

            setOfficeLocation(result);
            setIsEditing(false);
            setHasChanges(false);
            showToast('Office location saved successfully', 'success');

        } catch (error) {
            console.error('Error saving office location:', error);
            const errorMsg = error instanceof Error ? error.message : 'Failed to save office location';
            setError(errorMsg);
            showToast(errorMsg, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = (): void => {
        if (officeLocation) {
            setForm({
                name: officeLocation.name,
                latitude: officeLocation.latitude.toString(),
                longitude: officeLocation.longitude.toString()
            });
            setIsEditing(false);
            setHasChanges(false);
        } else {
            setForm({ name: '', latitude: '', longitude: '' });
        }
        setError(null);
        showToast('Changes discarded', 'info');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader width={400} height={400} />
            </div>
        );
    }

    return (
        <div className='w-screen h-full bg-bg p-8 flex gap-8'>
            <div className='w-[20%] h-[calc(100vh-4rem)] bg-white rounded-xl flex flex-col items-center p-8 gap-4 sticky top-8'>
                <div className='flex flex-col items-center gap-2'>
                    <div className="w-40 h-40 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center">
                        <BusinessIcon sx={{ fontSize: 80, color: '#2563eb' }} />
                    </div>
                    <div className='font-semibold text-text text-2xl'>Location Manager</div>
                    <div className='font-semibold text-stext'>Office Settings</div>
                </div>

                <div className='flex items-center gap-3 bg-[#47f2ca80] py-2 px-3 rounded-xl w-full cursor-pointer'>
                    <LocationOnIcon sx={{ fontSize: 20 }} />
                    <span className='font-semibold'>Edit Location</span>
                </div>

                <div className='flex items-center gap-3 py-2 px-3 rounded-xl w-full cursor-pointer'
                    onClick={() => router.push('/')}
                >
                    <HomeFilledIcon sx={{ fontSize: 20 }} />
                    <span className='font-semibold'>Back To Home</span>
                </div>

                <div className='flex items-center gap-3 py-2 px-3 rounded-xl w-full cursor-pointer'
                    onClick={() => router.push('/manager/dashboard')}
                >
                    <SpaceDashboardIcon sx={{ fontSize: 20 }} />
                    <span className='font-semibold'>Dashboard</span>
                </div>
            </div>

            <div className='w-[80%] bg-white rounded-xl p-8 gap-6 overflow-y-auto scrollbar-hide'>
                <div className='font-semibold text-xl text-text mb-6'>
                    {isEditing ? 'Edit Office Location' : 'Office Location Settings'}
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
                        <p>{error}</p>
                    </div>
                )}

                {!officeLocation && !isEditing ? (
                    <div className="text-center py-12">
                        <div className="p-6 bg-gray-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                            <LocationOnIcon sx={{ fontSize: 40, color: '#9ca3af' }} />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No office location configured</h3>
                        <p className="text-gray-600 mb-8 max-w-md mx-auto">
                            Configure your office location to enable location-based features for your team.
                        </p>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                        >
                            Configure Location
                        </button>
                    </div>
                ) : isEditing ? (
                    <div className='grid grid-cols-2 gap-6'>
                        <div className='flex flex-col gap-2 col-span-2'>
                            <label className='font-semibold text-gray-600'>Office Name</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                className='text-text p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors'
                                placeholder="Enter office name (e.g., Main Office, Delhi Branch)"
                            />
                        </div>

                        <div className='flex flex-col gap-2'>
                            <label className='font-semibold text-gray-600'>Latitude</label>
                            <input
                                type="number"
                                step="any"
                                value={form.latitude}
                                onChange={(e) => handleInputChange('latitude', e.target.value)}
                                className='text-text p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors'
                                placeholder="28.6139"
                            />
                            <p className="text-xs text-gray-500">Range: -90 to 90</p>
                        </div>

                        <div className='flex flex-col gap-2'>
                            <label className='font-semibold text-gray-600'>Longitude</label>
                            <input
                                type="number"
                                step="any"
                                value={form.longitude}
                                onChange={(e) => handleInputChange('longitude', e.target.value)}
                                className='text-text p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors'
                                placeholder="77.2090"
                            />
                            <p className="text-xs text-gray-500">Range: -180 to 180</p>
                        </div>

                        <div className='col-span-2 bg-amber-50 border border-amber-200 rounded-lg p-4'>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <MyLocationIcon sx={{ fontSize: 20, color: '#d97706' }} />
                                    <div>
                                        <p className="font-semibold text-amber-800">Use Current Location</p>
                                        <p className="text-sm text-amber-600">Automatically fill coordinates with your current position</p>
                                    </div>
                                </div>
                                <button
                                    onClick={getCurrentLocation}
                                    disabled={gettingLocation}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${gettingLocation
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : 'bg-amber-500 hover:bg-amber-600 text-white'
                                        }`}
                                >
                                    {gettingLocation ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Getting...
                                        </>
                                    ) : (
                                        <>
                                            <MyLocationIcon sx={{ fontSize: 16 }} />
                                            Get Location
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div>
                        <div className='bg-gray-50 rounded-lg p-6 mb-6'>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="text-center md:text-left">
                                    <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
                                        <BusinessIcon sx={{ fontSize: 20, color: '#2563eb' }} />
                                        <span className="text-sm font-semibold text-gray-600">Office Name</span>
                                    </div>
                                    <p className="text-lg font-semibold text-gray-900">{officeLocation?.name}</p>
                                </div>
                                <div className="text-center md:text-left">
                                    <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
                                        <PublicIcon sx={{ fontSize: 20, color: '#2563eb' }} />
                                        <span className="text-sm font-semibold text-gray-600">Latitude</span>
                                    </div>
                                    <p className="text-lg font-mono font-semibold text-gray-900">{officeLocation?.latitude}</p>
                                </div>
                                <div className="text-center md:text-left">
                                    <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
                                        <PublicIcon sx={{ fontSize: 20, color: '#2563eb' }} />
                                        <span className="text-sm font-semibold text-gray-600">Longitude</span>
                                    </div>
                                    <p className="text-lg font-mono font-semibold text-gray-900">{officeLocation?.longitude}</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setIsEditing(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
                        >
                            <EditIcon sx={{ fontSize: 20 }} />
                            Edit Location
                        </button>
                    </div>
                )}

                {isEditing && (
                    <div className='flex gap-4 pt-4 border-t border-gray-200'>
                        <button
                            onClick={handleSave}
                            disabled={!hasChanges || saving}
                            className={`px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${hasChanges && !saving
                                    ? 'bg-green-600 text-white hover:bg-green-700'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            {saving && (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            )}
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>

                        <button
                            onClick={handleCancel}
                            disabled={saving}
                            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${!saving
                                    ? 'bg-red-600 text-white hover:bg-red-700'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            {officeLocation ? 'Cancel' : 'Discard Changes'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LocationManager;