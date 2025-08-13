'use client'
import React, { useState, useEffect } from 'react';
import { MapPin, Save, Edit2 } from 'lucide-react';

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

const ManagerPage: React.FC = () => {
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOfficeLocation();
  }, []);

  const handleSave = async (): Promise<void> => {
    if (!form.name.trim()) {
      alert('Office name is required');
      return;
    }

    const lat = parseFloat(form.latitude);
    const lng = parseFloat(form.longitude);

    if (isNaN(lat) || isNaN(lng)) {
      alert('Please enter valid numbers for latitude and longitude');
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
      alert('Office location saved successfully');

    } catch (error) {
      console.error('Error saving office location:', error);
      alert(error instanceof Error ? error.message : 'Failed to save office location');
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Manager Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage office location</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <MapPin size={20} />
              Office Location
            </h2>
          </div>
          
          <div className="p-6">
            {!officeLocation && !isEditing ? (
              <div className="text-center py-8">
                <MapPin size={40} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">No office location set</p>
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  Set Office Location
                </button>
              </div>
            ) : isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Office Name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter office name"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={form.latitude}
                      onChange={(e) => setForm(prev => ({ ...prev, latitude: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="28.6139"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={form.longitude}
                      onChange={(e) => setForm(prev => ({ ...prev, longitude: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="77.2090"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save size={16} />
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  {officeLocation && (
                    <button
                      onClick={handleCancel}
                      disabled={saving}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <div className="space-y-3 mb-6">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Name:</span>
                    <p className="text-lg text-gray-900">{officeLocation?.name}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Coordinates:</span>
                    <p className="text-gray-900 font-mono">{officeLocation?.latitude}, {officeLocation?.longitude}</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <Edit2 size={16} />
                  Edit
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerPage;