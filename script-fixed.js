// Versão corrigida e robusta
let assets = [];
let organizations = [];
let datacenters = [];
let assetTypes = [];

// Função de notificação global
function showNotification(message, type) {
    console.log('Notificação:', message, type);
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

function generateGovernanceAnalysis() {
    console.log('=== GERANDO ANÁLISE DE GOVERNANÇA ===');
    
    try {
        if (!assets || assets.length === 0) {
            showNotification('Nenhum ativo cadastrado para análise de governança!', 'warning');
            return;
        }
        
        // Mostrar seção de governança
        document.getElementById('governanceSection').style.display = 'block';
        
        // Calcular KPIs
        calculateGovernanceKPIs();
        
        // Gerar gráficos
        generateSustainabilityMatrix();
        generateGovernanceTrend();
        
        // Gerar plano de ação
        generateActionPlan();
        
        // Gerar análise qualitativa
        generateQualitativeAnalysis();
        
        showNotification('Análise de governança gerada com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao gerar análise de governança:', error);
        showNotification('Erro ao gerar análise de governança', 'danger');
    }
}

function calculateGovernanceKPIs() {
    // Simular cálculos de KPIs baseados nos ativos
    const compliance = 75 + Math.random() * 20;
    const sustainability = 60 + Math.random() * 30;
    const efficiency = 70 + Math.random() * 25;
    const innovation = 65 + Math.random() * 30;
    
    document.getElementById('kpiCompliance').textContent = compliance.toFixed(1) + '%';
    document.getElementById('kpiSustainability').textContent = sustainability.toFixed(1) + '%';
    document.getElementById('kpiEfficiency').textContent = efficiency.toFixed(1) + '%';
    document.getElementById('kpiInnovation').textContent = innovation.toFixed(1) + '%';
}

function generateSustainabilityMatrix() {
    const ctx = document.getElementById('sustainabilityMatrix');
    if (!ctx) return;
    
    if (window.sustainabilityMatrixInstance) {
        window.sustainabilityMatrixInstance.destroy();
    }
    
    window.sustainabilityMatrixInstance = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Energia Renovável', 'Eficiência', 'Reciclagem', 'Conformidade', 'Inovação', 'Custo-Benefício'],
            datasets: [{
                label: 'Atual',
                data: [65, 75, 80, 70, 60, 85],
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)'
            }, {
                label: 'Meta',
                data: [90, 85, 90, 95, 80, 90],
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)'
            }]
        },
        options: {
            responsive: true,
            scales: { r: { beginAtZero: true, max: 100 } }
        }
    });
}

function generateGovernanceTrend() {
    const ctx = document.getElementById('governanceTrend');
    if (!ctx) return;
    
    if (window.governanceTrendInstance) {
        window.governanceTrendInstance.destroy();
    }
    
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
    
    window.governanceTrendInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'Conformidade',
                data: months.map(() => 70 + Math.random() * 20),
                borderColor: 'rgb(54, 162, 235)'
            }, {
                label: 'Sustentabilidade',
                data: months.map(() => 60 + Math.random() * 30),
                borderColor: 'rgb(75, 192, 192)'
            }, {
                label: 'Eficiência',
                data: months.map(() => 65 + Math.random() * 25),
                borderColor: 'rgb(255, 99, 132)'
            }]
        },
        options: {
            responsive: true,
            scales: { y: { beginAtZero: true, max: 100 } }
        }
    });
}

function generateActionPlan() {
    const actions = [
        { id: 'AC001', action: 'Modernizar servidores legados', category: 'Infraestrutura', priority: 'Alta', responsible: 'TI Infrastructure', deadline: '2024-03-31', kpi: 'Eficiência Operacional', status: 'Em andamento' },
        { id: 'AC002', action: 'Implementar sistema de gestão energética', category: 'Sustentabilidade', priority: 'Alta', responsible: 'Sustainability Team', deadline: '2024-04-15', kpi: 'Sustentabilidade', status: 'Pendente' },
        { id: 'AC003', action: 'Atualizar políticas de conformidade', category: 'Governança', priority: 'Média', responsible: 'Compliance', deadline: '2024-05-01', kpi: 'Conformidade Regulatória', status: 'Pendente' },
        { id: 'AC004', action: 'Migrar para cloud híbrida', category: 'Inovação', priority: 'Média', responsible: 'Cloud Team', deadline: '2024-06-30', kpi: 'Inovação Tecnológica', status: 'Planejamento' }
    ];
    
    const tbody = document.getElementById('actionPlanBody');
    tbody.innerHTML = actions.map(action => `
        <tr>
            <td>${action.id}</td>
            <td>${action.action}</td>
            <td><span class="badge bg-info">${action.category}</span></td>
            <td><span class="badge bg-${action.priority === 'Alta' ? 'danger' : 'warning'}">${action.priority}</span></td>
            <td>${action.responsible}</td>
            <td>${action.deadline}</td>
            <td>${action.kpi}</td>
            <td><span class="badge bg-${action.status === 'Em andamento' ? 'primary' : 'secondary'}">${action.status}</span></td>
        </tr>
    `).join('');
}

function generateQualitativeAnalysis() {
    const tbody = document.getElementById('qualitativeAnalysisBody');
    tbody.innerHTML = assets.map(asset => {
        const age = Math.floor(Math.random() * 10) + 1;
        const compliance = age > 5 ? 'Baixa' : age > 3 ? 'Média' : 'Alta';
        const consumption = asset.energy_consumption_kwh > 2000 ? 'Acima do padrão' : 'Adequado';
        const obsolescence = age > 7 ? 'Alto' : age > 5 ? 'Médio' : 'Baixo';
        const optimization = asset.energy_efficiency_percent < 70 ? 'Alto' : 'Médio';
        const recommendation = age > 5 ? 'Substituir' : 'Otimizar';
        
        return `
            <tr>
                <td>${asset.name}</td>
                <td>${age}</td>
                <td><span class="badge bg-${compliance === 'Alta' ? 'success' : compliance === 'Média' ? 'warning' : 'danger'}">${compliance}</span></td>
                <td><span class="badge bg-${consumption === 'Adequado' ? 'success' : 'warning'}">${consumption}</span></td>
                <td><span class="badge bg-${obsolescence === 'Baixo' ? 'success' : obsolescence === 'Médio' ? 'warning' : 'danger'}">${obsolescence}</span></td>
                <td><span class="badge bg-${optimization === 'Alto' ? 'danger' : 'warning'}">${optimization}</span></td>
                <td><span class="badge bg-primary">${recommendation}</span></td>
            </tr>
        `;
    }).join('');
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('=== DOM CARREGADO ===');
    initializeApp();
});

async function initializeApp() {
    try {
        console.log('=== INICIANDO APLICAÇÃO ===');
        
        // Teste básico de conexão
        console.log('Testando conexão com backend...');
        const healthResponse = await fetch('http://localhost:3001/health');
        if (!healthResponse.ok) {
            throw new Error('Backend não está respondendo');
        }
        const healthData = await healthResponse.json();
        console.log('Health check OK:', healthData);
        
        // Carregar dados em paralelo com tratamento de erro individual
        console.log('Carregando dados...');
        
        const results = await Promise.allSettled([
            loadAssetTypes(),
            loadOrganizations(),
            loadDatacenters(),
            loadAssets()
        ]);
        
        // Verificar resultados
        const assetTypesResult = results[0];
        const orgResult = results[1];
        const dcResult = results[2];
        const assetsResult = results[3];
        
        if (assetTypesResult.status === 'fulfilled') {
            assetTypes = assetTypesResult.value;
            console.log('Tipos de ativo carregados:', assetTypes.length);
            populateAssetTypeSelect();
        } else {
            console.warn('Erro ao carregar tipos de ativo:', assetTypesResult.reason);
        }
        
        if (orgResult.status === 'fulfilled') {
            organizations = orgResult.value;
            console.log('Organizações carregadas:', organizations.length);
            populateOrganizationSelect();
        } else {
            console.warn('Erro ao carregar organizações:', orgResult.reason);
        }
        
        if (dcResult.status === 'fulfilled') {
            datacenters = dcResult.value;
            console.log('Datacenters carregados:', datacenters.length);
            populateDatacenterSelect();
        } else {
            console.warn('Erro ao carregar datacenters:', dcResult.reason);
        }
        
        if (assetsResult.status === 'fulfilled') {
            assets = assetsResult.value;
            console.log('Ativos carregados:', assets.length);
            if (assets.length > 0) {
                updateAssetsTable();
                document.getElementById('assetsList').style.display = 'block';
            }
        } else {
            console.warn('Erro ao carregar ativos:', assetsResult.reason);
        }
        
        // Setup event listeners
        setupEventListeners();
        
        showNotification('Sistema carregado com sucesso!', 'success');
        console.log('=== APLICAÇÃO INICIALIZADA COM SUCESSO ===');
        
    } catch (error) {
        console.error('=== ERRO FATAL NA INICIALIZAÇÃO ===');
        console.error('Erro:', error);
        console.error('Mensagem:', error.message);
        console.error('Stack:', error.stack);
        showNotification('Erro ao carregar o sistema. Verifique a conexão com o backend.', 'danger');
    }
}

async function loadAssetTypes() {
    try {
        const response = await fetch('http://localhost:3001/api/assets/types/list');
        if (!response.ok) throw new Error('Falha ao carregar tipos de ativo');
        return await response.json();
    } catch (error) {
        console.error('Erro em loadAssetTypes:', error);
        throw error;
    }
}

async function loadOrganizations() {
    try {
        const response = await fetch('http://localhost:3001/api/organizations');
        if (!response.ok) throw new Error('Falha ao carregar organizações');
        const data = await response.json();
        return data.organizations || [];
    } catch (error) {
        console.error('Erro em loadOrganizations:', error);
        throw error;
    }
}

async function loadDatacenters() {
    try {
        const response = await fetch('http://localhost:3001/api/datacenters');
        if (!response.ok) throw new Error('Falha ao carregar datacenters');
        const data = await response.json();
        return data.datacenters || [];
    } catch (error) {
        console.error('Erro em loadDatacenters:', error);
        throw error;
    }
}

async function loadAssets() {
    try {
        const response = await fetch('http://localhost:3001/api/assets');
        if (!response.ok) throw new Error('Falha ao carregar ativos');
        const data = await response.json();
        return data.assets || [];
    } catch (error) {
        console.error('Erro em loadAssets:', error);
        throw error;
    }
}

function populateAssetTypeSelect() {
    const select = document.getElementById('assetType');
    if (!select) return;
    
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
    if (!select) return;
    
    select.innerHTML = '<option value="">Selecione...</option>';
    organizations.forEach(org => {
        const option = document.createElement('option');
        option.value = org.id;
        option.textContent = org.name;
        select.appendChild(option);
    });
}

function populateDatacenterSelect() {
    const select = document.getElementById('datacenterSelect');
    if (!select) return;
    
    select.innerHTML = '<option value="">Selecione...</option>';
    datacenters.forEach(dc => {
        const option = document.createElement('option');
        option.value = dc.id;
        option.textContent = dc.name;
        select.appendChild(option);
    });
}

function updateAssetsTable() {
    const tbody = document.getElementById('assetsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    assets.forEach(asset => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${asset.name}</td>
            <td>${asset.asset_type || 'N/A'}</td>
            <td>${asset.energy_consumption_kwh || 'N/A'}</td>
            <td>${asset.pue || 'N/A'}</td>
            <td>${asset.carbon_emission_kg || 'N/A'}</td>
            <td>${asset.energy_efficiency_percent || 'N/A'}%</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="viewAsset('${asset.id}')">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
    });
}

function setupEventListeners() {
    const assetForm = document.getElementById('assetForm');
    const orgSelect = document.getElementById('organizationSelect');
    
    if (assetForm) {
        assetForm.addEventListener('submit', handleAssetSubmit);
    }
    
    if (orgSelect) {
        orgSelect.addEventListener('change', handleOrganizationChange);
    }
}

function handleAssetSubmit(e) {
    e.preventDefault();
    console.log('Formulário submetido');
    // Implementar lógica de submissão
}

function handleOrganizationChange(e) {
    console.log('Organização selecionada:', e.target.value);
    // Implementar lógica de mudança
}

function viewAsset(assetId) {
    console.log('Visualizando ativo:', assetId);
    // Implementar visualização
}

function generateAnalysis() {
    console.log('=== GERANDO ANÁLISE ===');
    
    try {
        // Verificar se há ativos para analisar
        if (!assets || assets.length === 0) {
            showNotification('Nenhum ativo cadastrado para análise!', 'warning');
            return;
        }
        
        console.log('Analisando', assets.length, 'ativos');
        
        // Mostrar seção de análise
        const analysisSection = document.getElementById('analysisSection');
        if (analysisSection) {
            analysisSection.style.display = 'block';
        }
        
        // Gerar gráficos
        generateEnergyChart();
        generateCarbonChart();
        generateSpiderChart();
        generateEfficiencyChart();
        
        showNotification('Análise gerada com sucesso!', 'success');
        console.log('=== ANÁLISE CONCLUÍDA ===');
        
    } catch (error) {
        console.error('Erro ao gerar análise:', error);
        showNotification('Erro ao gerar análise. Verifique os dados.', 'danger');
    }
}

function generateEnergyChart() {
    const ctx = document.getElementById('energyChart');
    if (!ctx) return;
    
    // Destruir gráfico anterior se existir
    if (window.energyChartInstance) {
        window.energyChartInstance.destroy();
    }
    
    const labels = assets.map(asset => asset.name || 'N/A');
    const data = assets.map(asset => asset.energy_consumption_kwh || 0);
    
    window.energyChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Consumo de Energia (kWh/mês)',
                data: data,
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Energia (kWh/mês)'
                    }
                }
            }
        }
    });
}

function generateCarbonChart() {
    const ctx = document.getElementById('carbonChart');
    if (!ctx) return;
    
    // Destruir gráfico anterior se existir
    if (window.carbonChartInstance) {
        window.carbonChartInstance.destroy();
    }
    
    const labels = assets.map(asset => asset.name || 'N/A');
    const data = assets.map(asset => asset.carbon_emission_kg || 0);
    
    window.carbonChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Emissões de Carbono (kgCO2/mês)',
                data: data,
                backgroundColor: 'rgba(255, 99, 132, 0.6)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Carbono (kgCO2/mês)'
                    }
                }
            }
        }
    });
}

function generateSpiderChart() {
    const ctx = document.getElementById('spiderChart');
    if (!ctx) return;
    
    // Destruir gráfico anterior se existir
    if (window.spiderChartInstance) {
        window.spiderChartInstance.destroy();
    }
    
    // Calcular médias para teia de aranha
    const avgEnergy = assets.reduce((sum, asset) => sum + (asset.energy_consumption_kwh || 0), 0) / assets.length;
    const avgCarbon = assets.reduce((sum, asset) => sum + (asset.carbon_emission_kg || 0), 0) / assets.length;
    const avgPUE = assets.reduce((sum, asset) => sum + (asset.pue || 0), 0) / assets.length;
    const avgEfficiency = assets.reduce((sum, asset) => sum + (asset.energy_efficiency_percent || 0), 0) / assets.length;
    
    // Normalizar valores para 0-100
    const normalizedEnergy = Math.min(100, (avgEnergy / 1000) * 100);
    const normalizedCarbon = Math.min(100, (avgCarbon / 100) * 100);
    const normalizedPUE = Math.max(0, 100 - (avgPUE - 1) * 50);
    const normalizedEfficiency = avgEfficiency;
    
    window.spiderChartInstance = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Consumo de Energia', 'Emissões de Carbono', 'Eficiência PUE', 'Eficiência Energética'],
            datasets: [{
                label: 'Métricas de Eficiência',
                data: [normalizedEnergy, normalizedCarbon, normalizedPUE, normalizedEfficiency],
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                pointBackgroundColor: 'rgba(75, 192, 192, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(75, 192, 192, 1)'
            }]
        },
        options: {
            responsive: true,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

function generateEfficiencyChart() {
    const ctx = document.getElementById('efficiencyChart');
    if (!ctx) return;
    
    // Destruir gráfico anterior se existir
    if (window.efficiencyChartInstance) {
        window.efficiencyChartInstance.destroy();
    }
    
    // Simular dados de tendência (últimos 6 meses)
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
    const efficiencyData = months.map(() => 70 + Math.random() * 20); // Simulação
    
    window.efficiencyChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'Eficiência Energética (%)',
                data: efficiencyData,
                backgroundColor: 'rgba(153, 102, 255, 0.2)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 2,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
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
