# Green Cloud Analytics Platform

Plataforma completa para análise de eficiência energética e emissões de carbono em datacenters.

## 🌱 Funcionalidades

### 📊 Análise de Ativos
- Cadastro de múltiplos tipos de ativos (servidores, storage, rede, refrigeração)
- Cálculo automático de consumo energético
- Análise de emissões de carbono
- Avaliação de eficiência operacional

### 📈 Visualizações
- **Gráficos de Barras**: Consumo de energia por ativo
- **Gráficos de Pizza**: Distribuição de emissões de carbono
- **Teia de Aranha**: Análise multidimensional de eficiência
- **Gráficos de Linha**: Tendências de eficiência energética

### 🔍 Indicadores Chave (KPIs)
- Consumo total de energia
- Emissões totais de CO₂
- Eficiência energética média
- PUE (Power Usage Effectiveness) médio
- Intensidade de carbono
- Número de ativos monitorados

## 🚀 Como Usar

### 1. Cadastro de Ativos
Preencha o formulário com as seguintes informações:
- Nome do ativo
- Tipo (servidor, storage, rede, etc.)
- Consumo de energia (kWh/mês)
- PUE (Power Usage Effectiveness)
- Fator de emissão de carbono
- Taxa de utilização
- Temperatura operacional
- Eficiência energética
- Fonte de energia
- Certificações verdes

### 2. Geração de Análises
Após cadastrar os ativos, clique em "Gerar Análise" para visualizar:
- Gráficos interativos
- KPIs em tempo real
- Teia de aranha com métricas comparativas

### 3. Interpretação dos Resultados

#### Eficiência Energética
- **Alta (>80%)**: Excelente desempenho
- **Média (60-80%)**: Bom desempenho
- **Baixa (<60%)**: Necessita melhorias

#### PUE Ideal
- **Excelente**: 1.2 - 1.4
- **Bom**: 1.4 - 1.6
- **Precisa Melhorar**: > 1.6

#### Intensidade de Carbono
- **Baixa**: < 0.05 kgCO₂/kWh (energia renovável)
- **Média**: 0.05 - 0.1 kgCO₂/kWh (energia mista)
- **Alta**: > 0.1 kgCO₂/kWh (energia fóssil)

## 🎯 Métricas Calculadas

### Eficiência Energética
```
Eficiência = (Utilização × Fator Temperatura × Eficiência Operacional) × 100
```

### Emissões de Carbono
```
CO₂ = Consumo Energia × Fator de Emissão × Multiplicador Fonte × (1 - Bônus Certificação)
```

### Eficiência PUE
```
Eficiência PUE = max(0, (1 - (PUE - 1.2) / 2)) × 100
```

## 🔧 Tecnologias Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **UI Framework**: Bootstrap 5
- **Gráficos**: Chart.js
- **Ícones**: Font Awesome
- **Container**: Docker

## 🌍 Benefícios

### Para Organizações
- Redução de custos operacionais
- Compliance com regulamentações ambientais
- Melhoria da imagem corporativa
- Tomada de decisão baseada em dados

### Para o Meio Ambiente
- Redução de emissões de carbono
- Uso eficiente de recursos energéticos
- Apoio à transição para energia renovável
- Monitoramento contínuo do impacto ambiental

## 📋 Certificações Verdes Suportadas

- **LEED**: Leadership in Energy and Environmental Design
- **BREEAM**: Building Research Establishment Environmental Assessment Method
- **Energy Star**: Programa de eficiência energética
- **ISO 50001**: Sistema de gestão de energia

## 🔄 Fluxo de Trabalho

1. **Levantamento**: Inventário dos ativos do datacenter
2. **Coleta de Dados**: Consumo energético, PUE, temperaturas
3. **Análise**: Cálculo automático de métricas
4. **Visualização**: Gráficos e relatórios interativos
5. **Otimização**: Identificação de oportunidades de melhoria
6. **Monitoramento**: Acompanhamento contínuo do desempenho

## 🎨 Interface Responsiva

A plataforma é totalmente responsiva e funciona em:
- Desktops e laptops
- Tablets
- Smartphones

## 🚀 Implantação

### Via Docker
```bash
docker-compose up -d
```

Acesse: http://localhost:3000

### Desenvolvimento Local
```bash
# Clone o repositório
git clone <repository-url>

# Navegue até o projeto
cd green-cloud-platform

# Abra o index.html no navegador
```

## 📞 Suporte

Para dúvidas ou sugestões, consulte a documentação ou entre em contato com a equipe de desenvolvimento.

---

**Green Cloud Analytics** - Transformando dados em sustentabilidade 🌱
