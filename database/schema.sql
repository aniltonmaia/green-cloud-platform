-- Schema do Banco de Dados Green Cloud Analytics
-- PostgreSQL Normalizado

-- Extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Domínio para tipos de ativos
CREATE DOMAIN asset_type_enum AS VARCHAR(20)
CHECK (VALUE IN ('server', 'storage', 'network', 'cooling', 'power'));

-- Domínio para fontes de energia
CREATE DOMAIN energy_source_enum AS VARCHAR(20)
CHECK (VALUE IN ('renewable', 'mixed', 'fossil'));

-- Domínio para certificações verdes
CREATE DOMAIN green_certification_enum AS VARCHAR(20)
CHECK (VALUE IN ('leed', 'breeam', 'energy_star', 'iso_50001', 'none'));

-- Tabela de Organizações
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cnpj VARCHAR(20),
    industry VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Datacenters
CREATE TABLE datacenters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    total_area_m2 DECIMAL(10,2),
    total_power_capacity_kw DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Tipos de Ativos
CREATE TABLE asset_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(50)
);

-- Inserir tipos de ativos padrão
INSERT INTO asset_types (name, description, category) VALUES
('server', 'Servidores físicos ou virtuais', 'compute'),
('storage', 'Sistemas de armazenamento', 'storage'),
('network', 'Equipamentos de rede', 'network'),
('cooling', 'Sistemas de refrigeração', 'infrastructure'),
('power', 'Fontes de energia e UPS', 'infrastructure');

-- Tabela de Fontes de Energia
CREATE TABLE energy_sources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    carbon_factor DECIMAL(8,4) NOT NULL, -- kgCO2/kWh
    description TEXT
);

-- Inserir fontes de energia padrão
INSERT INTO energy_sources (name, carbon_factor, description) VALUES
('renewable', 0.025, 'Energia renovável (solar, eólica, hidrelétrica)'),
('mixed', 0.083, 'Fonte mista de energia'),
('fossil', 0.500, 'Combustíveis fósseis (carvão, gás, óleo)');

-- Tabela de Certificações Verdes
CREATE TABLE green_certifications (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    efficiency_bonus DECIMAL(5,2) NOT NULL, -- percentual de bônus
    description TEXT
);

-- Inserir certificações verdes padrão
INSERT INTO green_certifications (name, efficiency_bonus, description) VALUES
('leed', 15.00, 'Leadership in Energy and Environmental Design'),
('breeam', 12.00, 'Building Research Establishment Environmental Assessment Method'),
('energy_star', 10.00, 'Energy Star Certification'),
('iso_50001', 8.00, 'ISO 50001 Energy Management'),
('none', 0.00, 'Sem certificação verde');

-- Tabela de Ativos
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    datacenter_id UUID NOT NULL REFERENCES datacenters(id) ON DELETE CASCADE,
    asset_type_id INTEGER NOT NULL REFERENCES asset_types(id),
    name VARCHAR(255) NOT NULL,
    model VARCHAR(255),
    manufacturer VARCHAR(255),
    serial_number VARCHAR(100),
    purchase_date DATE,
    warranty_expiry DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (STATUS IN ('active', 'inactive', 'maintenance', 'decommissioned')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Medições Energéticas
CREATE TABLE energy_measurements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    measurement_date DATE NOT NULL,
    energy_consumption_kwh DECIMAL(10,2) NOT NULL, -- consumo mensal
    pue DECIMAL(4,2) NOT NULL, -- Power Usage Effectiveness
    utilization_percent DECIMAL(5,2) NOT NULL, -- percentual de utilização
    temperature_celsius DECIMAL(5,2) NOT NULL, -- temperatura operacional
    efficiency_percent DECIMAL(5,2) NOT NULL, -- eficiência energética
    energy_source_id INTEGER REFERENCES energy_sources(id),
    green_certification_id INTEGER REFERENCES green_certifications(id),
    carbon_emission_kg DECIMAL(10,4), -- calculado automaticamente
    power_usage_efficiency_percent DECIMAL(5,2), -- calculado automaticamente
    energy_efficiency_percent DECIMAL(5,2), -- calculado automaticamente
    carbon_intensity DECIMAL(8,4), -- calculado automaticamente
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Histórico de Cálculos
CREATE TABLE calculation_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    measurement_id UUID NOT NULL REFERENCES energy_measurements(id) ON DELETE CASCADE,
    calculation_type VARCHAR(50) NOT NULL,
    input_values JSONB,
    result_value DECIMAL(15,4),
    calculation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX idx_assets_datacenter_id ON assets(datacenter_id);
CREATE INDEX idx_assets_asset_type_id ON assets(asset_type_id);
CREATE INDEX idx_energy_measurements_asset_id ON energy_measurements(asset_id);
CREATE INDEX idx_energy_measurements_date ON energy_measurements(measurement_date);
CREATE INDEX idx_organizations_id ON organizations(id);
CREATE INDEX idx_datacenters_organization_id ON datacenters(organization_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar triggers nas tabelas
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_datacenters_updated_at BEFORE UPDATE ON datacenters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para cálculos automáticos
CREATE OR REPLACE FUNCTION calculate_energy_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Calcular emissão de carbono
    IF NEW.energy_source_id IS NOT NULL THEN
        SELECT carbon_factor INTO NEW.carbon_emission_kg
        FROM energy_sources
        WHERE id = NEW.energy_source_id;
        
        NEW.carbon_emission_kg := NEW.energy_consumption_kwh * NEW.carbon_emission_kg;
    END IF;
    
    -- Calcular eficiência PUE
    NEW.power_usage_efficiency_percent := GREATEST(0, (1 - (NEW.pue - 1.2) / 2)) * 100;
    NEW.power_usage_efficiency_percent := LEAST(100, NEW.power_usage_efficiency_percent);
    
    -- Calcular eficiência energética
    DECLARE
        utilization_factor DECIMAL;
        temperature_factor DECIMAL;
        efficiency_factor DECIMAL;
    BEGIN
        utilization_factor := NEW.utilization_percent / 100;
        temperature_factor := GREATEST(0.5, 1 - (ABS(NEW.temperature_celsius - 22) / 20));
        efficiency_factor := NEW.efficiency_percent / 100;
        
        NEW.energy_efficiency_percent := utilization_factor * temperature_factor * efficiency_factor * 100;
    END;
    
    -- Calcular intensidade de carbono
    IF NEW.energy_consumption_kwh > 0 THEN
        NEW.carbon_intensity := NEW.carbon_emission_kg / NEW.energy_consumption_kwh;
    END IF;
    
    -- Aplicar bônus de certificação verde
    IF NEW.green_certification_id IS NOT NULL THEN
        DECLARE
            certification_bonus DECIMAL;
        BEGIN
            SELECT efficiency_bonus INTO certification_bonus
            FROM green_certifications
            WHERE id = NEW.green_certification_id;
            
            NEW.carbon_intensity := NEW.carbon_intensity * (1 - certification_bonus / 100);
        END;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER calculate_energy_metrics_trigger 
BEFORE INSERT OR UPDATE ON energy_measurements 
FOR EACH ROW EXECUTE FUNCTION calculate_energy_metrics();

-- Views para consultas facilitadas
CREATE VIEW v_asset_summary AS
SELECT 
    a.id,
    a.name,
    at.name as asset_type,
    dc.name as datacenter,
    o.name as organization,
    a.status,
    em.measurement_date,
    em.energy_consumption_kwh,
    em.carbon_emission_kg,
    em.energy_efficiency_percent,
    em.power_usage_efficiency_percent,
    em.carbon_intensity
FROM assets a
JOIN asset_types at ON a.asset_type_id = at.id
JOIN datacenters dc ON a.datacenter_id = dc.id
JOIN organizations o ON dc.organization_id = o.id
LEFT JOIN LATERAL (
    SELECT * FROM energy_measurements 
    WHERE asset_id = a.id 
    ORDER BY measurement_date DESC 
    LIMIT 1
) em ON true;

CREATE VIEW v_organization_metrics AS
SELECT 
    o.id,
    o.name as organization_name,
    COUNT(DISTINCT dc.id) as datacenter_count,
    COUNT(DISTINCT a.id) as asset_count,
    COALESCE(SUM(em.energy_consumption_kwh), 0) as total_energy_consumption,
    COALESCE(SUM(em.carbon_emission_kg), 0) as total_carbon_emission,
    COALESCE(AVG(em.energy_efficiency_percent), 0) as avg_energy_efficiency,
    COALESCE(AVG(em.power_usage_efficiency_percent), 0) as avg_pue_efficiency
FROM organizations o
LEFT JOIN datacenters dc ON o.id = dc.organization_id
LEFT JOIN assets a ON dc.id = a.datacenter_id
LEFT JOIN energy_measurements em ON a.id = em.asset_id
GROUP BY o.id, o.name;
