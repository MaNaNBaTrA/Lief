'use client'
import React, { useState, useEffect } from 'react';
import { MapPin, Save, Edit2, Building2, Globe } from 'lucide-react';
import Loader from '@/components/LottieLoader'
import { useToast } from '@/context/ToastContext'

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



const Location: React.FC = () => {
    const { showToast } = useToast();
    const [officeLocation, setOfficeLocation] = useState<Office | null>(null);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [form, setForm] = useState<{ name: string; latitude: string; longitude: string }>({
        name: '',
        latitude: '',
        longitude: ''
    });
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);

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
            showToast('Office location saved successfully', 'success');

        } catch (error) {
            console.error('Error saving office location:', error);
            showToast(error instanceof Error ? error.message : 'Failed to save office location', 'error');
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
        } else {
            setForm({ name: '', latitude: '', longitude: '' });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader width={400} height={400} />
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
                <div className="max-w-4xl mx-auto px-4 py-8">
                    {/* Header */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-8 mb-8 backdrop-blur-sm">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-xl">
                                <Building2 className="w-8 h-8 text-blue-600" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900">Manager Dashboard</h1>
                                <p className="text-slate-600 mt-1 text-lg">Configure your office location settings</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden backdrop-blur-sm">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-slate-200/60">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <MapPin className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-900">Office Location</h2>
                                    <p className="text-slate-600 text-sm">Set your primary office coordinates</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8">
                            {!officeLocation && !isEditing ? (
                                <div className="text-center py-12">
                                    <div className="p-6 bg-slate-50 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                                        <MapPin className="w-10 h-10 text-slate-400" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-slate-900 mb-2">No office location configured</h3>
                                    <p className="text-slate-600 mb-8 max-w-md mx-auto">
                                        Configure your office location to enable location-based features for your team.
                                    </p>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                    >
                                        Configure Location
                                    </button>
                                </div>
                            ) : isEditing ? (
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-3">
                                            Office Name
                                        </label>
                                        <div className="relative">
                                            <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                                            <input
                                                type="text"
                                                value={form.name}
                                                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                                                className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                                                placeholder="Enter office name (e.g., Main Office, Delhi Branch)"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-3">
                                                Latitude
                                            </label>
                                            <div className="relative">
                                                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                <input
                                                    type="number"
                                                    step="any"
                                                    value={form.latitude}
                                                    onChange={(e) => setForm(prev => ({ ...prev, latitude: e.target.value }))}
                                                    className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                                                    placeholder="28.6139"
                                                />
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1">Range: -90 to 90</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-3">
                                                Longitude
                                            </label>
                                            <div className="relative">
                                                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                <input
                                                    type="number"
                                                    step="any"
                                                    value={form.longitude}
                                                    onChange={(e) => setForm(prev => ({ ...prev, longitude: e.target.value }))}
                                                    className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                                                    placeholder="77.2090"
                                                />
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1">Range: -180 to 180</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-6 py-3 rounded-xl flex items-center gap-3 font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                        >
                                            {saving ? (
                                                <>
                                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="w-5 h-5" />
                                                    Save Location
                                                </>
                                            )}
                                        </button>
                                        {officeLocation && (
                                            <button
                                                onClick={handleCancel}
                                                disabled={saving}
                                                className="bg-slate-500 hover:bg-slate-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-6 mb-8">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="text-center md:text-left">
                                                <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
                                                    <Building2 className="w-5 h-5 text-blue-600" />
                                                    <span className="text-sm font-semibold text-slate-600">Office Name</span>
                                                </div>
                                                <p className="text-lg font-semibold text-slate-900">{officeLocation?.name}</p>
                                            </div>
                                            <div className="text-center md:text-left">
                                                <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
                                                    <Globe className="w-5 h-5 text-blue-600" />
                                                    <span className="text-sm font-semibold text-slate-600">Latitude</span>
                                                </div>
                                                <p className="text-lg font-mono font-semibold text-slate-900">{officeLocation?.latitude}</p>
                                            </div>
                                            <div className="text-center md:text-left">
                                                <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
                                                    <Globe className="w-5 h-5 text-blue-600" />
                                                    <span className="text-sm font-semibold text-slate-600">Longitude</span>
                                                </div>
                                                <p className="text-lg font-mono font-semibold text-slate-900">{officeLocation?.longitude}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl flex items-center gap-3 font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                    >
                                        <Edit2 className="w-5 h-5" />
                                        Edit Location
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Location;