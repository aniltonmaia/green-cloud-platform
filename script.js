let assets = [];
let charts = {};

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('assetForm').addEventListener('submit', handleAssetSubmit);
    initializeDefaultValues();
});

function initializeDefaultValues() {
    document.getElementById('carbonFactor').value = '0.083';
}

function handleAssetSubmit(e) {
    e.preventDefault();
    
    const asset = {
        id: Date.now(),
        name: document.getElementById('assetName').value,
        type: document.getElementById('assetType').value,
        energyConsumption: parseFloat(document.getElementById('energyConsumption').value),
        pue: parseFloat(document.getElementById('pue').value),
        carbonFactor: parseFloat(document.getElementById('carbonFactor').value),
        utilization: parseFloat(document.getElementById('utilization').value),
        temperature: parseFloat(document.getElementById('temperature').value),
        efficiency: parseFloat(document.getElementById('efficiency').value),
        energySource: document.getElementById('energySource').value,
        greenCertification: document.getElementById('greenCertification').value
    };
    
    asset.carbonEmission = calculateCarbonEmission(asset);
    asset.powerUsageEffectiveness = calculatePUEEfficiency(asset);
    asset.energyEfficiency = calculateEnergyEfficiency(asset);
    asset.carbonIntensity = calculateCarbonIntensity(asset);
    
    assets.push(asset);
    updateAssetsTable();
    clearForm();
    
    document.getElementById('assetsList').style.display = 'block';
    
    showNotification('Ativo adicionado com sucesso!', 'success');
}

function calculateCarbonEmission(asset) {
    return (asset.energyConsumption * asset.carbonFactor).toFixed(2);
}

function calculatePUEEfficiency(asset) {
    const idealPUE = 1.2;
    const efficiency = Math.max(0, (1 - (asset.pue - idealPUE) / 2)) * 100;
    return Math.min(100, efficiency).toFixed(1);
}

function calculateEnergyEfficiency(asset) {
    const utilizationFactor = asset.utilization / 100;
    const temperatureFactor = calculateTemperatureFactor(asset.temperature);
    const efficiencyFactor = asset.efficiency / 100;
    
    return (utilizationFactor * temperatureFactor * efficiencyFactor * 100).toFixed(1);
}

function calculateTemperatureFactor(temperature) {
    const optimalTemp = 22;
    const deviation = Math.abs(temperature - optimalTemp);
    return Math.max(0.5, 1 - (deviation / 20));
}

function calculateCarbonIntensity(asset) {
    const energySourceMultiplier = getEnergySourceMultiplier(asset.energySource);
    const certificationBonus = getCertificationBonus(asset.greenCertification);
    
    const baseIntensity = asset.carbonFactor;
    const adjustedIntensity = baseIntensity * energySourceMultiplier * (1 - certificationBonus);
    
    return adjustedIntensity.toFixed(3);
}

function getEnergySourceMultiplier(source) {
    const multipliers = {
        'renewable': 0.3,
        'mixed': 0.7,
        'fossil': 1.0
    };
    return multipliers[source] || 1.0;
}

function getCertificationBonus(certification) {
    const bonuses = {
        'leed': 0.15,
        'breeam': 0.12,
        'energy_star': 0.10,
        'iso_50001': 0.08,
        'none': 0
    };
    return bonuses[certification] || 0;
}

function updateAssetsTable() {
    const tbody = document.getElementById('assetsTableBody');
    tbody.innerHTML = '';
    
    assets.forEach(asset => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${asset.name}</td>
            <td><span class="badge asset-type-${asset.type}">${getAssetTypeLabel(asset.type)}</span></td>
            <td>${asset.energyConsumption}</td>
            <td>${asset.pue}</td>
            <td>${asset.carbonEmission}</td>
            <td><span class="badge ${getEfficiencyClass(asset.energyEfficiency)}">${asset.energyEfficiency}%</span></td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="removeAsset(${asset.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
    });
}

function getAssetTypeLabel(type) {
    const labels = {
        'server': 'Servidor',
        'storage': 'Storage',
        'network': 'Rede',
        'cooling': 'Refrigeração',
        'power': 'Energia'
    };
    return labels[type] || type;
}

function getEfficiencyClass(efficiency) {
    const eff = parseFloat(efficiency);
    if (eff >= 80) return 'energy-efficiency-high';
    if (eff >= 60) return 'energy-efficiency-medium';
    return 'energy-efficiency-low';
}

function removeAsset(id) {
    assets = assets.filter(asset => asset.id !== id);
    updateAssetsTable();
    
    if (assets.length === 0) {
        document.getElementById('assetsList').style.display = 'none';
        document.getElementById('analysisSection').style.display = 'none';
    }
    
    showNotification('Ativo removido com sucesso!', 'warning');
}

function clearForm() {
    document.getElementById('assetForm').reset();
    document.getElementById('carbonFactor').value = '0.083';
}

function generateAnalysis() {
    if (assets.length === 0) {
        showNotification('Adicione pelo menos um ativo para gerar análise!', 'danger');
        return;
    }
    
    document.getElementById('analysisSection').style.display = 'block';
    document.getElementById('analysisSection').classList.add('fade-in');
    
    setTimeout(() => {
        createEnergyChart();
        createCarbonChart();
        createSpiderChart();
        createEfficiencyChart();
        generateKPISummary();
    }, 100);
    
    showNotification('Análise gerada com sucesso!', 'success');
}

function createEnergyChart() {
    const ctx = document.getElementById('energyChart').getContext('2d');
    
    if (charts.energy) {
        charts.energy.destroy();
    }
    
    charts.energy = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: assets.map(asset => asset.name),
            datasets: [{
                label: 'Consumo de Energia (kWh/mês)',
                data: assets.map(asset => asset.energyConsumption),
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

function createCarbonChart() {
    const ctx = document.getElementById('carbonChart').getContext('2d');
    
    if (charts.carbon) {
        charts.carbon.destroy();
    }
    
    charts.carbon = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: assets.map(asset => asset.name),
            datasets: [{
                data: assets.map(asset => parseFloat(asset.carbonEmission)),
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

function createSpiderChart() {
    const ctx = document.getElementById('spiderChart').getContext('2d');
    
    if (charts.spider) {
        charts.spider.destroy();
    }
    
    const datasets = assets.map((asset, index) => {
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
            label: asset.name,
            data: [
                parseFloat(asset.energyEfficiency),
                parseFloat(asset.powerUsageEffectiveness),
                asset.utilization,
                asset.efficiency,
                100 - (parseFloat(asset.carbonIntensity) * 100),
                asset.greenCertification ? 80 : 50
            ],
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
            labels: [
                'Eficiência Energética',
                'Eficiência PUE',
                'Utilização',
                'Eficiência Operacional',
                'Baixa Intensidade de Carbono',
                'Certificação Verde'
            ],
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
}

function createEfficiencyChart() {
    const ctx = document.getElementById('efficiencyChart').getContext('2d');
    
    if (charts.efficiency) {
        charts.efficiency.destroy();
    }
    
    charts.efficiency = new Chart(ctx, {
        type: 'line',
        data: {
            labels: assets.map(asset => asset.name),
            datasets: [{
                label: 'Eficiência Energética (%)',
                data: assets.map(asset => parseFloat(asset.energyEfficiency)),
                borderColor: 'rgba(46, 204, 113, 1)',
                backgroundColor: 'rgba(46, 204, 113, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true
            }, {
                label: 'Eficiência PUE (%)',
                data: assets.map(asset => parseFloat(asset.powerUsageEffectiveness)),
                borderColor: 'rgba(52, 152, 219, 1)',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
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

function generateKPISummary() {
    const totalEnergy = assets.reduce((sum, asset) => sum + asset.energyConsumption, 0);
    const totalCarbon = assets.reduce((sum, asset) => sum + parseFloat(asset.carbonEmission), 0);
    const avgEfficiency = assets.reduce((sum, asset) => sum + parseFloat(asset.energyEfficiency), 0) / assets.length;
    const avgPUE = assets.reduce((sum, asset) => sum + asset.pue, 0) / assets.length;
    
    const kpiData = [
        {
            label: 'Consumo Total',
            value: totalEnergy.toFixed(2),
            unit: 'kWh/mês',
            icon: 'fa-bolt',
            color: 'energy-blue'
        },
        {
            label: 'Emissões de CO₂',
            value: totalCarbon.toFixed(2),
            unit: 'kg/mês',
            icon: 'fa-cloud',
            color: 'carbon-gray'
        },
        {
            label: 'Eficiência Média',
            value: avgEfficiency.toFixed(1),
            unit: '%',
            icon: 'fa-chart-line',
            color: 'success-green'
        },
        {
            label: 'PUE Médio',
            value: avgPUE.toFixed(2),
            unit: '',
            icon: 'fa-tachometer-alt',
            color: 'warning-orange'
        },
        {
            label: 'Intensidade de Carbono',
            value: (totalCarbon / totalEnergy).toFixed(3),
            unit: 'kgCO₂/kWh',
            icon: 'fa-leaf',
            color: 'primary-green'
        },
        {
            label: 'Número de Ativos',
            value: assets.length,
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
        alertDiv.remove();
    }, 5000);
}
