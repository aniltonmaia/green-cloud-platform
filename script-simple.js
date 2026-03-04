// Versão simplificada para debug
let assets = [];

document.addEventListener('DOMContentLoaded', function() {
    console.log('=== PÁGINA CARREGADA ===');
    initializeSimpleApp();
});

async function initializeSimpleApp() {
    try {
        console.log('=== INICIANDO VERSÃO SIMPLIFICADA ===');
        
        // Teste básico de API
        console.log('Testando conexão básica...');
        const response = await fetch('http://localhost:3001/health');
        const data = await response.json();
        console.log('API funcionando:', data);
        
        // Carregar organizações
        console.log('Carregando organizações...');
        const orgResponse = await fetch('http://localhost:3001/api/organizations');
        const orgData = await orgResponse.json();
        console.log('Organizações:', orgData.organizations.length);
        
        // Preencher select
        const orgSelect = document.getElementById('organizationSelect');
        if (orgSelect) {
            orgSelect.innerHTML = '<option value="">Selecione...</option>';
            orgData.organizations.forEach(org => {
                const option = document.createElement('option');
                option.value = org.id;
                option.textContent = org.name;
                orgSelect.appendChild(option);
            });
            console.log('Select de organizações preenchido');
        }
        
        // Mostrar mensagem de sucesso
        showNotification('Sistema carregado com sucesso!', 'success');
        console.log('=== APLICAÇÃO INICIALIZADA COM SUCESSO ===');
        
    } catch (error) {
        console.error('=== ERRO NA INICIALIZAÇÃO ===');
        console.error('Erro:', error);
        console.error('Mensagem:', error.message);
        showNotification('Erro ao carregar o sistema. Verifique a conexão com o backend.', 'danger');
    }
}

function showNotification(message, type) {
    console.log('Mostrando notificação:', message, type);
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.parentNode.removeChild(alertDiv);
        }
    }, 5000);
}
