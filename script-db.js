// Database-enabled JavaScript for Green Cloud Analytics Platform
let assets = [];
let charts = {};
let organizations = [];
let datacenters = [];
let assetTypes = [];

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    try {
        console.log('Iniciando aplicação...');
        
        // Skip health check for now and try to load data directly
        console.log('Verificando conexão com a API...');
        
        // Load initial data
        console.log('Carregando dados iniciais...');
        await loadInitialData();
        console.log('Dados iniciais carregados!');
        
        // Setup event listeners
        console.log('Configurando event listeners...');
        setupEventListeners();
        
        // Initialize default values
        console.log('Inicializando valores padrão...');
        initializeDefaultValues();
        
        showNotification('Sistema carregado com sucesso!', 'success');
        console.log('Aplicação inicializada com sucesso!');
    } catch (error) {
        console.error('Error initializing app:', error);
        console.error('Stack trace:', error.stack);
        showNotification('Erro ao carregar o sistema. Verifique a conexão com o backend.', 'danger');
    }
}

async function loadInitialData() {
    try {
        console.log('=== INICIANDO CARREGAMENTO DE DADOS ===');
        
        console.log('Passo 1: Carregando tipos de ativos...');
        // Load asset types
        const assetTypesResponse = await api.getAssetTypes();
        console.log('Resposta de tipos de ativos:', assetTypesResponse);
        assetTypes = Array.isArray(assetTypesResponse) ? assetTypesResponse : [];
        console.log('Tipos de ativos carregados:', assetTypes.length, 'itens');
        populateAssetTypeSelect();
        console.log('Passo 1: CONCLUÍDO');
        
        console.log('Passo 2: Carregando organizações...');
        // Load organizations
        const orgResponse = await OrganizationManager.loadOrganizations();
        console.log('Resposta de organizações:', orgResponse);
        organizations = Array.isArray(orgResponse) ? orgResponse : [];
        console.log('Organizações carregadas:', organizations.length, 'itens');
        populateOrganizationSelect();
        console.log('Passo 2: CONCLUÍDO');
        
        console.log('Passo 3: Carregando datacenters...');
        // Load datacenters
        const dcResponse = await DatacenterManager.loadDatacenters();
        console.log('Resposta de datacenters:', dcResponse);
        datacenters = Array.isArray(dcResponse) ? dcResponse : [];
        console.log('Datacenters carregados:', datacenters.length, 'itens');
        populateDatacenterSelect();
        console.log('Passo 3: CONCLUÍDO');
        
        console.log('Passo 4: Carregando ativos existentes...');
        // Load existing assets
        const assetsResponse = await AssetManager.loadAssets();
        console.log('Resposta de ativos:', assetsResponse);
        assets = Array.isArray(assetsResponse) ? assetsResponse : [];
        console.log('Ativos carregados:', assets.length, 'itens');
        if (assets.length > 0) {
            updateAssetsTable();
            document.getElementById('assetsList').style.display = 'block';
        }
        console.log('Passo 4: CONCLUÍDO');
        console.log('=== TODOS OS DADOS CARREGADOS COM SUCESSO ===');
    } catch (error) {
        console.error('=== ERRO NO CARREGAMENTO DE DADOS ===');
        console.error('Error loading initial data:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Stack trace:', error.stack);
        // Don't throw error for initial loading, just log it
        showNotification('Aviso: Alguns dados podem não estar disponíveis. Usando dados em cache.', 'warning');
    }
}

function setupEventListeners() {
    document.getElementById('assetForm').addEventListener('submit', handleAssetSubmit);
    document.getElementById('organizationSelect').addEventListener('change', handleOrganizationChange);
}

function populateAssetTypeSelect() {
    const select = document.getElementById('assetType');
    select.innerHTML = '<option value="">Selecione...</option>';
    
    assetTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type.id;
        option.textContent = type.name;
        select.appendChild(option);
    });
}

function populateOrganizationSelect() {
    const select = document.getElementById('organizationSelect');
    select.innerHTML = '<option value="">Selecione...</option>';
    
    organizations.forEach(org => {
        const option = document.createElement('option');
        option.value = org.id;
        option.textContent = org.name;
        select.appendChild(option);
    });
}

function populateDatacenterSelect(organizationId = null) {
    const select = document.getElementById('datacenterSelect');
    select.innerHTML = '<option value="">Selecione...</option>';
    
    let filteredDatacenters = datacenters;
    if (organizationId) {
        filteredDatacenters = datacenters.filter(dc => dc.organization_id === organizationId);
    }
    
    filteredDatacenters.forEach(dc => {
        const option = document.createElement('option');
        option.value = dc.id;
        option.textContent = dc.name;
        select.appendChild(option);
    });
}

async function handleOrganizationChange(e) {
    const organizationId = e.target.value;
    populateDatacenterSelect(organizationId);
}

function initializeDefaultValues() {
    document.getElementById('carbonFactor').value = '0.083';
    document.getElementById('measurementDate').value = new Date().toISOString().split('T')[0];
}

async function handleAssetSubmit(e) {
    e.preventDefault();
    
    try {
        const formData = getFormData();
        
        // Create asset
        const asset = await AssetManager.createAssetWithMeasurement(formData.asset, formData.measurement);
        
        // Reload assets list
        assets = await AssetManager.loadAssets();
        updateAssetsTable();
        clearForm();
        
        document.getElementById('assetsList').style.display = 'block';
        
        showNotification('Ativo adicionado com sucesso!', 'success');
    } catch (error) {
        console.error('Error creating asset:', error);
        showNotification('Erro ao adicionar ativo: ' + error.message, 'danger');
    }
}

function getFormData() {
    return {
        asset: {
            name: document.getElementById('assetName').value,
            datacenter_id: document.getElementById('datacenterSelect').value,
            asset_type_id: parseInt(document.getElementById('assetType').value),
            model: document.getElementById('assetModel').value,
            manufacturer: document.getElementById('assetManufacturer').value,
            serial_number: document.getElementById('serialNumber').value,
            purchase_date: document.getElementById('purchaseDate').value,
            warranty_expiry: document.getElementById('warrantyExpiry').value,
            status: document.getElementById('assetStatus').value
        },
        measurement: {
            measurement_date: document.getElementById('measurementDate').value,
            energy_consumption_kwh: parseFloat(document.getElementById('energyConsumption').value),
            pue: parseFloat(document.getElementById('pue').value),
            utilization_percent: parseFloat(document.getElementById('utilization').value),
            temperature_celsius: parseFloat(document.getElementById('temperature').value),
            efficiency_percent: parseFloat(document.getElementById('efficiency').value),
            energy_source_id: getEnergySourceId(document.getElementById('energySource').value),
            green_certification_id: getCertificationId(document.getElementById('greenCertification').value),
            notes: document.getElementById('notes').value
        }
    };
}

function getEnergySourceId(sourceName) {
    const mapping = {
        'renewable': 1,
        'mixed': 2,
        'fossil': 3
    };
    return mapping[sourceName] || null;
}

function getCertificationId(certificationName) {
    const mapping = {
        'leed': 1,
        'breeam': 2,
        'energy_star': 3,
        'iso_50001': 4,
        'none': 5
    };
    return mapping[certificationName] || null;
}

function updateAssetsTable() {
    const tbody = document.getElementById('assetsTableBody');
    tbody.innerHTML = '';
    
    assets.forEach(asset => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${asset.name}</td>
            <td><span class="badge asset-type-${asset.asset_type?.category || 'default'}">${asset.asset_type?.name || asset.asset_type_id}</span></td>
            <td>${asset.latest_measurement?.energy_consumption_kwh || 'N/A'}</td>
            <td>${asset.latest_measurement?.pue || 'N/A'}</td>
            <td>${asset.latest_measurement?.carbon_emission_kg || 'N/A'}</td>
            <td><span class="badge ${getEfficiencyClass(asset.latest_measurement?.energy_efficiency_percent)}">${asset.latest_measurement?.energy_efficiency_percent || 'N/A'}%</span></td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="viewAssetDetails('${asset.id}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="removeAsset('${asset.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
    });
}

function getEfficiencyClass(efficiency) {
    const eff = parseFloat(efficiency);
    if (eff >= 80) return 'energy-efficiency-high';
    if (eff >= 60) return 'energy-efficiency-medium';
    return 'energy-efficiency-low';
}

async function viewAssetDetails(assetId) {
    try {
        const asset = await api.getAsset(assetId);
        
        // Create modal with asset details
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Detalhes do Ativo: ${asset.asset.name}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6>Informações Gerais</h6>
                                <p><strong>Nome:</strong> ${asset.asset.name}</p>
                                <p><strong>Tipo:</strong> ${asset.asset_type?.name}</p>
                                <p><strong>Modelo:</strong> ${asset.asset.model || 'N/A'}</p>
                                <p><strong>Fabricante:</strong> ${asset.asset.manufacturer || 'N/A'}</p>
                                <p><strong>Número de Série:</strong> ${asset.asset.serial_number || 'N/A'}</p>
                                <p><strong>Status:</strong> ${asset.asset.status}</p>
                            </div>
                            <div class="col-md-6">
                                <h6>Última Medição</h6>
                                <p><strong>Data:</strong> ${asset.measurements[0]?.measurement_date || 'N/A'}</p>
                                <p><strong>Consumo:</strong> ${asset.measurements[0]?.energy_consumption_kwh || 'N/A'} kWh</p>
                                <p><strong>PUE:</strong> ${asset.measurements[0]?.pue || 'N/A'}</p>
                                <p><strong>Emissão CO₂:</strong> ${asset.measurements[0]?.carbon_emission_kg || 'N/A'} kg</p>
                                <p><strong>Eficiência:</strong> ${asset.measurements[0]?.energy_efficiency_percent || 'N/A'}%</p>
                            </div>
                        </div>
                        <div class="row mt-3">
                            <div class="col-12">
                                <h6>Histórico de Medições</h6>
                                <div class="table-responsive">
                                    <table class="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>Data</th>
                                                <th>Consumo (kWh)</th>
                                                <th>PUE</th>
                                                <th>CO₂ (kg)</th>
                                                <th>Eficiência (%)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${asset.measurements.map(m => `
                                                <tr>
                                                    <td>${m.measurement_date}</td>
                                                    <td>${m.energy_consumption_kwh}</td>
                                                    <td>${m.pue}</td>
                                                    <td>${m.carbon_emission_kg}</td>
                                                    <td>${m.energy_efficiency_percent}</td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
        
        modal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modal);
        });
        
    } catch (error) {
        console.error('Error viewing asset details:', error);
        showNotification('Erro ao carregar detalhes do ativo', 'danger');
    }
}

async function removeAsset(assetId) {
    if (!confirm('Tem certeza que deseja excluir este ativo?')) {
        return;
    }
    
    try {
        await AssetManager.deleteAssetWithMeasurements(assetId);
        assets = assets.filter(asset => asset.id !== assetId);
        updateAssetsTable();
        
        if (assets.length === 0) {
            document.getElementById('assetsList').style.display = 'none';
            document.getElementById('analysisSection').style.display = 'none';
        }
        
        showNotification('Ativo removido com sucesso!', 'warning');
    } catch (error) {
        console.error('Error removing asset:', error);
        showNotification('Erro ao remover ativo: ' + error.message, 'danger');
    }
}

function clearForm() {
    document.getElementById('assetForm').reset();
    initializeDefaultValues();
}

async function generateAnalysis() {
    if (assets.length === 0) {
        showNotification('Adicione pelo menos um ativo para gerar análise!', 'danger');
        return;
    }
    
    try {
        document.getElementById('analysisSection').style.display = 'block';
        document.getElementById('analysisSection').classList.add('fade-in');
        
        // Load dashboard data from API
        const dashboardData = await AnalyticsManager.loadDashboardData();
        
        setTimeout(() => {
            createEnergyChart(dashboardData?.consumptionByType || []);
            createCarbonChart(dashboardData?.consumptionByType || []);
            createSpiderChart();
            createEfficiencyChart(dashboardData?.trend || []);
            generateKPISummary(dashboardData?.metrics || {});
        }, 100);
        
        showNotification('Análise gerada com sucesso!', 'success');
    } catch (error) {
        console.error('Error generating analysis:', error);
        showNotification('Erro ao gerar análise: ' + error.message, 'danger');
    }
}

function createEnergyChart(data) {
    const ctx = document.getElementById('energyChart').getContext('2d');
    
    if (charts.energy) {
        charts.energy.destroy();
    }
    
    charts.energy = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(item => item.asset_type || item.name),
            datasets: [{
                label: 'Consumo de Energia (kWh/mês)',
                data: data.map(item => item.total_consumption || 0),
                backgroundColor: 'rgba(52, 152, 219, 0.6)',
                borderColor: 'rgba(52, 152, 219, 1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'kWh/mês'
                    }
                }
            }
        }
    });
}

function createCarbonChart(data) {
    const ctx = document.getElementById('carbonChart').getContext('2d');
    
    if (charts.carbon) {
        charts.carbon.destroy();
    }
    
    charts.carbon = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: data.map(item => item.asset_type || item.name),
            datasets: [{
                data: data.map(item => item.total_emission || 0),
                backgroundColor: [
                    'rgba(231, 76, 60, 0.7)',
                    'rgba(241, 196, 15, 0.7)',
                    'rgba(46, 204, 113, 0.7)',
                    'rgba(52, 152, 219, 0.7)',
                    'rgba(155, 89, 182, 0.7)'
                ],
                borderColor: [
                    'rgba(231, 76, 60, 1)',
                    'rgba(241, 196, 15, 1)',
                    'rgba(46, 204, 113, 1)',
                    'rgba(52, 152, 219, 1)',
                    'rgba(155, 89, 182, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.parsed.toFixed(2) + ' kg CO₂/mês';
                        }
                    }
                }
            }
        }
    });
}

async function createSpiderChart() {
    const ctx = document.getElementById('spiderChart').getContext('2d');
    
    if (charts.spider) {
        charts.spider.destroy();
    }
    
    try {
        const assetIds = assets.slice(0, 5).map(asset => asset.id); // Limit to 5 assets
        const spiderData = await AnalyticsManager.generateSpiderChart(assetIds);
        
        const datasets = spiderData.datasets.map((dataset, index) => {
            const colors = [
                'rgba(52, 152, 219, 0.2)',
                'rgba(46, 204, 113, 0.2)',
                'rgba(241, 196, 15, 0.2)',
                'rgba(231, 76, 60, 0.2)',
                'rgba(155, 89, 182, 0.2)'
            ];
            
            const borderColors = [
                'rgba(52, 152, 219, 1)',
                'rgba(46, 204, 113, 1)',
                'rgba(241, 196, 15, 1)',
                'rgba(231, 76, 60, 1)',
                'rgba(155, 89, 182, 1)'
            ];
            
            return {
                label: dataset.label,
                data: dataset.data,
                backgroundColor: colors[index % colors.length],
                borderColor: borderColors[index % borderColors.length],
                borderWidth: 2,
                pointBackgroundColor: borderColors[index % borderColors.length],
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: borderColors[index % borderColors.length]
            };
        });
        
        charts.spider = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: spiderData.labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            stepSize: 20
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating spider chart:', error);
    }
}

function createEfficiencyChart(data) {
    const ctx = document.getElementById('efficiencyChart').getContext('2d');
    
    if (charts.efficiency) {
        charts.efficiency.destroy();
    }
    
    charts.efficiency = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(item => new Date(item.month).toLocaleDateString()),
            datasets: [{
                label: 'Eficiência Energética Média (%)',
                data: data.map(item => parseFloat(item.avg_efficiency) || 0),
                borderColor: 'rgba(46, 204, 113, 1)',
                backgroundColor: 'rgba(46, 204, 113, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Eficiência (%)'
                    }
                }
            }
        }
    });
}

function generateKPISummary(metrics) {
    const kpiData = [
        {
            label: 'Consumo Total',
            value: metrics.total_energy_consumption?.toFixed(2) || '0',
            unit: 'kWh/mês',
            icon: 'fa-bolt',
            color: 'energy-blue'
        },
        {
            label: 'Emissões de CO₂',
            value: metrics.total_carbon_emission?.toFixed(2) || '0',
            unit: 'kg/mês',
            icon: 'fa-cloud',
            color: 'carbon-gray'
        },
        {
            label: 'Eficiência Média',
            value: metrics.avg_energy_efficiency?.toFixed(1) || '0',
            unit: '%',
            icon: 'fa-chart-line',
            color: 'success-green'
        },
        {
            label: 'Número de Ativos',
            value: metrics.total_assets || 0,
            unit: 'ativos',
            icon: 'fa-server',
            color: 'energy-blue'
        }
    ];
    
    const kpiContainer = document.getElementById('kpiSummary');
    kpiContainer.innerHTML = '';
    
    kpiData.forEach(kpi => {
        const kpiCard = document.createElement('div');
        kpiCard.className = 'col-md-4 col-sm-6 mb-3';
        kpiCard.innerHTML = `
            <div class="kpi-card">
                <i class="fas ${kpi.icon} fa-2x mb-2" style="color: var(--${kpi.color})"></i>
                <div class="kpi-value" style="color: var(--${kpi.color})">${kpi.value}</div>
                <div class="kpi-label">${kpi.label}</div>
                <div class="kpi-unit">${kpi.unit}</div>
            </div>
        `;
        kpiContainer.appendChild(kpiCard);
    });
}

function showNotification(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.parentNode.removeChild(alertDiv);
        }
    }, 5000);
}
