'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Edit, Building, Globe, Locate, Home, LayoutDashboard, Menu, X } from 'lucide-react';
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
    const [sidebarOpen, setSidebarOpen] = useState(false);

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

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const sidebar = document.getElementById('mobile-sidebar')
            const menuButton = document.getElementById('menu-button')
            
            if (sidebarOpen && sidebar && !sidebar.contains(event.target as Node) && 
                menuButton && !menuButton.contains(event.target as Node)) {
                setSidebarOpen(false)
            }
        }

        if (sidebarOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [sidebarOpen])

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setSidebarOpen(false)
            }
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

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

    const handleDashboard = (): void => {
        router.push('/manager/dashboard')
        setSidebarOpen(false)
    }

    const handleBackToHome = (): void => {
        router.push('/')
        setSidebarOpen(false)
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader width={400} height={400} />
            </div>
        );
    }

    return (
        <div className='min-h-screen bg-bg'>
            <header className="lg:hidden flex items-center py-2 px-4 justify-between bg-bg border-b-2 border-border sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-blue-200 bg-blue-100 flex items-center justify-center cursor-pointer">
                        <Building size={20} className="text-blue-600" />
                    </div>
                    <div>
                        <h1 className="font-semibold text-lg text-text">Location Manager</h1>
                        <p className="text-sm text-gray-500">Office Settings</p>
                    </div>
                </div>
                
                <button
                    id="menu-button"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-3 rounded-lg hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
                    aria-label="Toggle menu"
                >
                    {sidebarOpen ? (
                        <X size={28} className="text-text" strokeWidth={2} />
                    ) : (
                        <Menu size={28} className="text-text" strokeWidth={2} />
                    )}
                </button>
            </header>

            {sidebarOpen && (
                <div className="fixed inset-0 bg-black/20 z-40 lg:hidden" />
            )}

            {sidebarOpen && (
                <div 
                    id="mobile-sidebar"
                    className="fixed top-[73px] right-4 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 lg:hidden max-h-[calc(100vh-120px)] overflow-y-auto"
                >
                    <div className="p-4">
                        <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-blue-200 bg-blue-100 flex items-center justify-center cursor-pointer">
                                <Building size={24} className="text-blue-600" />
                            </div>
                            <div>
                                <p className="font-semibold text-text">Location Manager</p>
                                <p className="text-xs text-gray-500">Office Settings</p>
                            </div>
                        </div>

                        <div className="py-3 space-y-2">
                            <div className='flex items-center gap-3 bg-[#47f2ca80] p-2 rounded-lg w-full'>
                                <MapPin size={16} className="text-text" strokeWidth={1.7} />
                                <span className='font-medium text-sm'>Edit Location</span>
                            </div>

                            <button
                                type="button"
                                className="w-full text-left p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-text font-medium text-sm flex items-center gap-2 cursor-pointer"
                                onClick={handleBackToHome}
                            >
                                <Home size={16} strokeWidth={1.7} />
                                Back To Home
                            </button>

                            <button
                                type="button"
                                className="w-full text-left p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-text font-medium text-sm flex items-center gap-2 cursor-pointer"
                                onClick={handleDashboard}
                            >
                                <LayoutDashboard size={16} strokeWidth={1.7} />
                                Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="lg:flex lg:gap-8 lg:p-8 lg:h-screen">
                <div className="hidden lg:flex lg:w-80 bg-white rounded-xl flex-col p-8 h-full">
                    <div className='flex flex-col items-center gap-4 mb-8'>
                        <div className="w-40 h-40 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center border-2 border-blue-200 cursor-pointer">
                            <Building size={80} className="text-blue-600" />
                        </div>
                        <div className='font-semibold text-text text-2xl text-center'>Location Manager</div>
                        <div className='font-semibold text-stext text-center'>Office Settings</div>
                    </div>

                    <div className="w-full space-y-4">
                        <div className='flex items-center gap-3 bg-[#47f2ca80] py-3 px-4 rounded-xl w-full'>
                            <MapPin size={20} strokeWidth={1.7} />
                            <span className='font-semibold'>Edit Location</span>
                        </div>

                        <div 
                            className='flex items-center gap-3 hover:bg-gray-50 py-3 px-4 rounded-xl w-full cursor-pointer transition-colors'
                            onClick={handleBackToHome}
                        >
                            <Home size={20} strokeWidth={1.7} />
                            <span className='font-semibold'>Back To Home</span>
                        </div>

                        <div 
                            className='flex items-center gap-3 hover:bg-gray-50 py-3 px-4 rounded-xl w-full cursor-pointer transition-colors'
                            onClick={handleDashboard}
                        >
                            <LayoutDashboard size={20} strokeWidth={1.7} />
                            <span className='font-semibold'>Dashboard</span>
                        </div>
                    </div>
                </div>

                <div className='flex-1 p-4 lg:p-0 min-h-screen lg:min-h-0 lg:h-full'>
                    <div className='bg-white rounded-xl p-4 lg:p-8 flex flex-col gap-6 h-full'>
                        <div className='flex-1 overflow-y-auto'>
                            <div className='font-semibold text-xl lg:text-2xl text-text mb-6'>
                                {isEditing ? 'Edit Office Location' : 'Office Location Settings'}
                            </div>

                            {error && (
                                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
                                    <p className="text-sm lg:text-base">{error}</p>
                                </div>
                            )}

                            {!officeLocation && !isEditing ? (
                                <div className="text-center py-8 lg:py-12">
                                    <div className="p-6 bg-gray-100 rounded-full w-20 h-20 lg:w-24 lg:h-24 mx-auto mb-6 flex items-center justify-center cursor-pointer">
                                        <MapPin size={32} className="text-gray-500 lg:w-10 lg:h-10" />
                                    </div>
                                    <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2">No office location configured</h3>
                                    <p className="text-gray-600 mb-6 lg:mb-8 max-w-md mx-auto text-sm lg:text-base">
                                        Configure your office location to enable location-based features for your team.
                                    </p>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="bg-[#47f2ca80] hover:bg-[#47f2ca] text-gray-900 px-6 lg:px-8 py-2 lg:py-3 rounded-lg font-medium transition-colors text-sm lg:text-base cursor-pointer"
                                    >
                                        Configure Location
                                    </button>
                                </div>
                            ) : isEditing ? (
                                <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6'>
                                    <div className='flex flex-col gap-2 lg:col-span-2'>
                                        <label className='font-semibold text-gray-600 text-sm lg:text-base'>Office Name</label>
                                        <input
                                            type="text"
                                            value={form.name}
                                            onChange={(e) => handleInputChange('name', e.target.value)}
                                            className='text-text p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors text-sm lg:text-base cursor-text'
                                            placeholder="Enter office name (e.g., Main Office, Delhi Branch)"
                                        />
                                    </div>

                                    <div className='flex flex-col gap-2'>
                                        <label className='font-semibold text-gray-600 text-sm lg:text-base'>Latitude</label>
                                        <input
                                            type="number"
                                            step="any"
                                            value={form.latitude}
                                            onChange={(e) => handleInputChange('latitude', e.target.value)}
                                            className='text-text p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors text-sm lg:text-base cursor-text'
                                            placeholder="28.6139"
                                        />
                                        <p className="text-xs text-gray-500">Range: -90 to 90</p>
                                    </div>

                                    <div className='flex flex-col gap-2'>
                                        <label className='font-semibold text-gray-600 text-sm lg:text-base'>Longitude</label>
                                        <input
                                            type="number"
                                            step="any"
                                            value={form.longitude}
                                            onChange={(e) => handleInputChange('longitude', e.target.value)}
                                            className='text-text p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors text-sm lg:text-base cursor-text'
                                            placeholder="77.2090"
                                        />
                                        <p className="text-xs text-gray-500">Range: -180 to 180</p>
                                    </div>

                                    <div className='lg:col-span-2 bg-amber-50 border border-amber-200 rounded-lg p-4'>
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                            <div className="flex items-start gap-3">
                                                <Locate size={20} className="text-amber-600 mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <p className="font-semibold text-amber-800 text-sm lg:text-base">Use Current Location</p>
                                                    <p className="text-xs lg:text-sm text-amber-600">Automatically fill coordinates with your current position</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={getCurrentLocation}
                                                disabled={gettingLocation}
                                                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm lg:text-base flex-shrink-0 cursor-pointer ${gettingLocation
                                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                        : 'bg-[#47f2ca80] hover:bg-[#47f2ca] text-gray-900'
                                                    }`}
                                            >
                                                {gettingLocation ? (
                                                    <>
                                                        <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                                                        Getting...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Locate size={20} />
                                                        Get Location
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div className='bg-gray-50 rounded-lg p-4 lg:p-6 mb-6'>
                                        <div className="grid grid-cols-1 gap-4 lg:gap-6">
                                            <div className="text-left px-4">
                                                <div className="flex items-center gap-2 mb-2 justify-start">
                                                    <Building size={20} className="text-blue-600" />
                                                    <span className="text-sm font-semibold text-gray-600">Office Name</span>
                                                </div>
                                                <p className="text-base lg:text-lg font-semibold text-gray-900">{officeLocation?.name}</p>
                                            </div>
                                            <div className="text-left px-4">
                                                <div className="flex items-center gap-2 mb-2 justify-start">
                                                    <Globe size={20} className="text-blue-600" />
                                                    <span className="text-sm font-semibold text-gray-600">Latitude</span>
                                                </div>
                                                <p className="text-base lg:text-lg font-mono font-semibold text-gray-900">{officeLocation?.latitude}</p>
                                            </div>
                                            <div className="text-left px-4">
                                                <div className="flex items-center gap-2 mb-2 justify-start">
                                                    <Globe size={20} className="text-blue-600" />
                                                    <span className="text-sm font-semibold text-gray-600">Longitude</span>
                                                </div>
                                                <p className="text-base lg:text-lg font-mono font-semibold text-gray-900">{officeLocation?.longitude}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="bg-[#47f2ca80] hover:bg-[#47f2ca] text-gray-900 px-4 lg:px-6 py-2 lg:py-3 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm lg:text-base cursor-pointer"
                                    >
                                        <Edit size={20}  />
                                        Edit Location
                                    </button>
                                </div>
                            )}
                        </div>

                        {isEditing && (
                            <div className='flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-200 mt-auto'>
                                <button
                                    onClick={handleSave}
                                    disabled={!hasChanges || saving}
                                    className={`px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 text-sm lg:text-base cursor-pointer ${hasChanges && !saving
                                            ? 'bg-[#47f2ca80] text-gray-900 hover:bg-[#47f2ca]'
                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        }`}
                                >
                                    {saving && (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                                    )}
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>

                                <button
                                    onClick={handleCancel}
                                    disabled={saving}
                                    className={`px-6 py-3 rounded-lg font-semibold transition-colors text-sm lg:text-base cursor-pointer ${!saving
                                            ? 'bg-red-500 text-white hover:bg-red-600 '
                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        }`}
                                >
                                    {officeLocation ? 'Cancel' : 'Discard Changes'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LocationManager;