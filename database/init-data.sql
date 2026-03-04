-- Dados iniciais para o Green Cloud Analytics Platform
-- Este script será executado automaticamente quando o container PostgreSQL iniciar

-- Inserir organizações de exemplo
INSERT INTO organizations (id, name, description, industry) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'TechCorp Solutions', 'Empresa de tecnologia com foco em cloud computing', 'Tecnologia'),
('550e8400-e29b-41d4-a716-446655440002', 'GreenData Center', 'Datacenter especializado em soluções sustentáveis', 'Datacenter'),
('550e8400-e29b-41d4-a716-446655440003', 'FinanceHub', 'Instituição financeira com múltiplos datacenters', 'Financeiro');

-- Inserir datacenters de exemplo
INSERT INTO datacenters (id, organization_id, name, location, total_area_m2, total_power_capacity_kw) VALUES
('550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440001', 'São Paulo Datacenter', 'São Paulo, SP', 5000.00, 2500.00),
('550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440001', 'Rio de Janeiro Datacenter', 'Rio de Janeiro, RJ', 3500.00, 1800.00),
('550e8400-e29b-41d4-a716-446655440103', '550e8400-e29b-41d4-a716-446655440002', 'EcoCampus', 'Campinas, SP', 8000.00, 5000.00),
('550e8400-e29b-41d4-a716-446655440104', '550e8400-e29b-41d4-a716-446655440003', 'Financial Hub DC', 'São Paulo, SP', 6000.00, 3000.00);

-- Inserir ativos de exemplo
INSERT INTO assets (id, datacenter_id, asset_type_id, name, model, manufacturer, serial_number, purchase_date, warranty_expiry, status) VALUES
('550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440101', 1, 'Web Server 01', 'PowerEdge R740', 'Dell', 'DL001234567', '2023-01-15', '2026-01-15', 'active'),
('550e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655440101', 1, 'Database Server 01', 'ProLiant DL380', 'HP', 'HP001234568', '2023-02-20', '2026-02-20', 'active'),
('550e8400-e29b-41d4-a716-446655440203', '550e8400-e29b-41d4-a716-446655440101', 2, 'Storage Array 01', 'Unity XT 480', 'Dell EMC', 'EM001234569', '2023-03-10', '2026-03-10', 'active'),
('550e8400-e29b-41d4-a716-446655440204', '550e8400-e29b-41d4-a716-446655440101', 3, 'Core Switch 01', 'Nexus 9000', 'Cisco', 'CS001234570', '2023-01-25', '2026-01-25', 'active'),
('550e8400-e29b-41d4-a716-446655440205', '550e8400-e29b-41d4-a716-446655440101', 4, 'CRAC Unit 01', 'CoolStream 2000', 'Vertiv', 'VR001234571', '2023-01-10', '2026-01-10', 'active'),
('550e8400-e29b-41d4-a716-446655440206', '550e8400-e29b-41d4-a716-446655440102', 1, 'Application Server 01', 'PowerEdge R650', 'Dell', 'DL001234572', '2023-04-15', '2026-04-15', 'active'),
('550e8400-e29b-41d4-a716-446655440207', '550e8400-e29b-41d4-a716-446655440102', 5, 'UPS System 01', 'Galaxy VX', 'Schneider Electric', 'SE001234573', '2023-01-05', '2026-01-05', 'active'),
('550e8400-e29b-41d4-a716-446655440208', '550e8400-e29b-41d4-a716-446655440103', 1, 'Virtual Server Farm 01', 'BladeSystem', 'HPE', 'HP001234574', '2023-05-20', '2026-05-20', 'active'),
('550e8400-e29b-41d4-a716-446655440209', '550e8400-e29b-41d4-a716-446655440103', 2, 'SAN Storage 01', 'Pure Storage', 'FlashArray', 'PS001234575', '2023-06-10', '2026-06-10', 'active'),
('550e8400-e29b-41d4-a716-446655440210', '550e8400-e29b-41d4-a716-446655440104', 1, 'Trading Server 01', 'PowerEdge R750', 'Dell', 'DL001234576', '2023-07-15', '2026-07-15', 'active');

-- Inserir medições energéticas de exemplo (últimos 3 meses)
INSERT INTO energy_measurements (id, asset_id, measurement_date, energy_consumption_kwh, pue, utilization_percent, temperature_celsius, efficiency_percent, energy_source_id, green_certification_id, notes) VALUES
-- Mês atual
('550e8400-e29b-41d4-a716-446655440301', '550e8400-e29b-41d4-a716-446655440201', CURRENT_DATE - INTERVAL '1 month', 850.50, 1.45, 75.0, 22.5, 85.0, 2, 2, 'Operação normal'),
('550e8400-e29b-41d4-a716-446655440302', '550e8400-e29b-41d4-a716-446655440202', CURRENT_DATE - INTERVAL '1 month', 1200.75, 1.42, 80.0, 21.8, 88.0, 2, 1, 'Alta performance'),
('550e8400-e29b-41d4-a716-446655440303', '550e8400-e29b-41d4-a716-446655440203', CURRENT_DATE - INTERVAL '1 month', 450.25, 1.38, 65.0, 23.0, 82.0, 1, 2, 'Storage otimizado'),
('550e8400-e29b-41d4-a716-446655440304', '550e8400-e29b-41d4-a716-446655440204', CURRENT_DATE - INTERVAL '1 month', 180.00, 1.35, 90.0, 20.5, 92.0, 1, 1, 'Rede eficiente'),
('550e8400-e29b-41d4-a716-446655440305', '550e8400-e29b-41d4-a716-446655440205', CURRENT_DATE - INTERVAL '1 month', 2200.00, 1.50, 85.0, 18.0, 78.0, 3, 5, 'Sistema de refrigeração'),
('550e8400-e29b-41d4-a716-446655440306', '550e8400-e29b-41d4-a716-446655440206', CURRENT_DATE - INTERVAL '1 month', 650.00, 1.48, 70.0, 22.0, 80.0, 2, 2, 'Servidor de aplicação'),
('550e8400-e29b-41d4-a716-446655440307', '550e8400-e29b-41d4-a716-446655440207', CURRENT_DATE - INTERVAL '1 month', 95.50, 1.25, 60.0, 25.0, 75.0, 1, 3, 'UPS standby'),
('550e8400-e29b-41d4-a716-446655440308', '550e8400-e29b-41d4-a716-446655440208', CURRENT_DATE - INTERVAL '1 month', 2100.00, 1.40, 95.0, 21.0, 90.0, 1, 1, 'Virtualização eficiente'),
('550e8400-e29b-41d4-a716-446655440309', '550e8400-e29b-41d4-a716-446655440209', CURRENT_DATE - INTERVAL '1 month', 380.75, 1.36, 72.0, 22.8, 84.0, 1, 2, 'SAN all-flash'),
('550e8400-e29b-41d4-a716-446655440310', '550e8400-e29b-41d4-a716-446655440210', CURRENT_DATE - INTERVAL '1 month', 950.00, 1.44, 88.0, 20.8, 86.0, 2, 1, 'Sistema de trading'),

-- Mês anterior
('550e8400-e29b-41d4-a716-446655440311', '550e8400-e29b-41d4-a716-446655440201', CURRENT_DATE - INTERVAL '2 months', 820.00, 1.47, 72.0, 23.2, 83.0, 2, 2, 'Operação normal'),
('550e8400-e29b-41d4-a716-446655440312', '550e8400-e29b-41d4-a716-446655440202', CURRENT_DATE - INTERVAL '2 months', 1180.50, 1.44, 78.0, 22.1, 86.0, 2, 1, 'Alta performance'),
('550e8400-e29b-41d4-a716-446655440313', '550e8400-e29b-41d4-a716-446655440203', CURRENT_DATE - INTERVAL '2 months', 435.00, 1.40, 63.0, 23.5, 80.0, 1, 2, 'Storage otimizado'),
('550e8400-e29b-41d4-a716-446655440314', '550e8400-e29b-41d4-a716-446655440204', CURRENT_DATE - INTERVAL '2 months', 175.25, 1.37, 88.0, 20.8, 90.0, 1, 1, 'Rede eficiente'),
('550e8400-e29b-41d4-a716-446655440315', '550e8400-e29b-41d4-a716-446655440205', CURRENT_DATE - INTERVAL '2 months', 2150.00, 1.52, 83.0, 18.5, 76.0, 3, 5, 'Sistema de refrigeração'),

-- 2 meses atrás
('550e8400-e29b-41d4-a716-446655440316', '550e8400-e29b-41d4-a716-446655440201', CURRENT_DATE - INTERVAL '3 months', 800.00, 1.49, 70.0, 23.8, 81.0, 2, 2, 'Operação normal'),
('550e8400-e29b-41d4-a716-446655440317', '550e8400-e29b-41d4-a716-446655440202', CURRENT_DATE - INTERVAL '3 months', 1150.00, 1.46, 75.0, 22.4, 84.0, 2, 1, 'Alta performance'),
('550e8400-e29b-41d4-a716-446655440318', '550e8400-e29b-41d4-a716-446655440203', CURRENT_DATE - INTERVAL '3 months', 420.00, 1.42, 60.0, 24.0, 78.0, 1, 2, 'Storage otimizado'),
('550e8400-e29b-41d4-a716-446655440319', '550e8400-e29b-41d4-a716-446655440204', CURRENT_DATE - INTERVAL '3 months', 170.00, 1.39, 85.0, 21.2, 88.0, 1, 1, 'Rede eficiente'),
('550e8400-e29b-41d4-a716-446655440320', '550e8400-e29b-41d4-a716-446655440205', CURRENT_DATE - INTERVAL '3 months', 2100.00, 1.55, 80.0, 19.0, 74.0, 3, 5, 'Sistema de refrigeração');

-- Inserir histórico de cálculos (exemplo)
INSERT INTO calculation_history (id, measurement_id, calculation_type, input_values, result_value, calculation_date) VALUES
('550e8400-e29b-41d4-a716-446655440401', '550e8400-e29b-41d4-a716-446655440301', 'carbon_emission', '{"energy_consumption_kwh": 850.50, "carbon_factor": 0.083}', 70.59, CURRENT_TIMESTAMP),
('550e8400-e29b-41d4-a716-446655440402', '550e8400-e29b-41d4-a716-446655440301', 'energy_efficiency', '{"utilization": 75.0, "temperature": 22.5, "efficiency": 85.0}', 63.75, CURRENT_TIMESTAMP),
('550e8400-e29b-41d4-a716-446655440403', '550e8400-e29b-41d4-a716-446655440302', 'carbon_emission', '{"energy_consumption_kwh": 1200.75, "carbon_factor": 0.083}', 99.66, CURRENT_TIMESTAMP),
('550e8400-e29b-41d4-a716-446655440404', '550e8400-e29b-41d4-a716-446655440302', 'energy_efficiency', '{"utilization": 80.0, "temperature": 21.8, "efficiency": 88.0}', 70.40, CURRENT_TIMESTAMP);

-- Atualizar estatísticas do banco de dados
ANALYZE;

-- Mostrar resumo dos dados inseridos
DO $$
DECLARE
    org_count INTEGER;
    dc_count INTEGER;
    asset_count INTEGER;
    measurement_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO org_count FROM organizations;
    SELECT COUNT(*) INTO dc_count FROM datacenters;
    SELECT COUNT(*) INTO asset_count FROM assets;
    SELECT COUNT(*) INTO measurement_count FROM energy_measurements;
    
    RAISE NOTICE '=== Green Cloud Analytics - Dados Iniciais Carregados ===';
    RAISE NOTICE 'Organizações: %', org_count;
    RAISE NOTICE 'Datacenters: %', dc_count;
    RAISE NOTICE 'Ativos: %', asset_count;
    RAISE NOTICE 'Medições Energéticas: %', measurement_count;
    RAISE NOTICE '================================================';
END $$;
