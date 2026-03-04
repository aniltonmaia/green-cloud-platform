// API Client for Green Cloud Analytics Platform
class GreenCloudAPI {
    constructor(baseURL = 'http://localhost:3001/api') {
        this.baseURL = baseURL;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Organizations
    async getOrganizations(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/organizations?${queryString}`);
    }

    async getOrganization(id) {
        return this.request(`/organizations/${id}`);
    }

    async createOrganization(data) {
        return this.request('/organizations', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateOrganization(id, data) {
        return this.request(`/organizations/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteOrganization(id) {
        return this.request(`/organizations/${id}`, {
            method: 'DELETE'
        });
    }

    // Datacenters
    async getDatacenters(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/datacenters?${queryString}`);
    }

    async getDatacenter(id) {
        return this.request(`/datacenters/${id}`);
    }

    async createDatacenter(data) {
        return this.request('/datacenters', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateDatacenter(id, data) {
        return this.request(`/datacenters/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteDatacenter(id) {
        return this.request(`/datacenters/${id}`, {
            method: 'DELETE'
        });
    }

    async getDatacenterAnalytics(id, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/datacenters/${id}/analytics?${queryString}`);
    }

    // Assets
    async getAssets(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/assets?${queryString}`);
    }

    async getAsset(id) {
        return this.request(`/assets/${id}`);
    }

    async createAsset(data) {
        return this.request('/assets', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateAsset(id, data) {
        return this.request(`/assets/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteAsset(id) {
        return this.request(`/assets/${id}`, {
            method: 'DELETE'
        });
    }

    async addAssetMeasurement(id, data) {
        return this.request(`/assets/${id}/measurements`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async getAssetTypes() {
        return this.request('/assets/types/list');
    }

    // Analytics
    async getDashboardData(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/analytics/dashboard?${queryString}`);
    }

    async getSpiderChartData(assetIds) {
        const params = Array.isArray(assetIds) 
            ? assetIds.map(id => `asset_ids=${id}`).join('&')
            : `asset_ids=${assetIds}`;
        return this.request(`/analytics/spider-chart?${params}`);
    }

    async getEfficiencyComparison(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/analytics/efficiency-comparison?${queryString}`);
    }

    async getCarbonFootprint(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/analytics/carbon-footprint?${queryString}`);
    }

    async getRecommendations(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/analytics/recommendations?${queryString}`);
    }

    // Health Check
    async healthCheck() {
        const response = await fetch('http://localhost:3001/health', {
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        if (!response.ok) {
            throw new Error('Health check failed');
        }
        return await response.json();
    }
}

// Global API instance
const api = new GreenCloudAPI();

// Utility functions for common operations
const AssetManager = {
    async loadAssets(filters = {}) {
        try {
            const response = await api.getAssets(filters);
            return response.assets || [];
        } catch (error) {
            console.error('Error loading assets:', error);
            return [];
        }
    },

    async createAssetWithMeasurement(assetData, measurementData) {
        try {
            // Create asset first
            const asset = await api.createAsset(assetData);
            
            // Add measurement if provided
            if (measurementData) {
                await api.addAssetMeasurement(asset.id, measurementData);
            }
            
            return asset;
        } catch (error) {
            console.error('Error creating asset with measurement:', error);
            throw error;
        }
    },

    async deleteAssetWithMeasurements(id) {
        try {
            await api.deleteAsset(id);
            return true;
        } catch (error) {
            console.error('Error deleting asset:', error);
            throw error;
        }
    }
};

const AnalyticsManager = {
    async loadDashboardData(filters = {}) {
        try {
            return await api.getDashboardData(filters);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            return null;
        }
    },

    async generateSpiderChart(assetIds) {
        try {
            return await api.getSpiderChartData(assetIds);
        } catch (error) {
            console.error('Error generating spider chart:', error);
            return null;
        }
    },

    async loadRecommendations(filters = {}) {
        try {
            return await api.getRecommendations(filters);
        } catch (error) {
            console.error('Error loading recommendations:', error);
            return null;
        }
    }
};

const OrganizationManager = {
    async loadOrganizations() {
        try {
            const response = await api.getOrganizations();
            return response.organizations || [];
        } catch (error) {
            console.error('Error loading organizations:', error);
            return [];
        }
    },

    async createOrganization(data) {
        try {
            return await api.createOrganization(data);
        } catch (error) {
            console.error('Error creating organization:', error);
            throw error;
        }
    }
};

const DatacenterManager = {
    async loadDatacenters(organizationId = null) {
        try {
            const params = organizationId ? { organization_id: organizationId } : {};
            const response = await api.getDatacenters(params);
            return response.datacenters || [];
        } catch (error) {
            console.error('Error loading datacenters:', error);
            return [];
        }
    },

    async createDatacenter(data) {
        try {
            return await api.createDatacenter(data);
        } catch (error) {
            console.error('Error creating datacenter:', error);
            throw error;
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        GreenCloudAPI,
        api,
        AssetManager,
        AnalyticsManager,
        OrganizationManager,
        DatacenterManager
    };
}
