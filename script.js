// URL da sua API do Google Apps Script (a nova, que você re-implantou)
const API_URL = "https://script.google.com/macros/s/AKfycbwrpKejqXSu1Fn4zjAZ5jdzI1Qw7Yg3Bi5DcWlbwdVV4pq9pYLpn4eE4Wq0bAJrooTi/exec";

// Mapeamento dos elementos do HTML para facilitar o acesso
const elements = {
    temp: { value: 'temp-value', chart: 'temp-chart', sheet: 'TEMPERATURA', unit: '°C' },
    humAir: { value: 'hum-air-value', chart: 'hum-air-chart', sheet: 'UMIDADE_AR', unit: '%' },
    humSoil: { value: 'hum-soil-value', chart: 'hum-soil-chart', sheet: 'UMIDADE_SOLO', unit: '' },
    lumInt: { value: 'lum-int-value', chart: 'lum-int-chart', sheet: 'LUMINOSIDADE_INTERNA', unit: '' }
};

const charts = {}; // Objeto para armazenar as instâncias dos gráficos

// Função genérica para criar um gráfico
function createChart(canvasId, label, data) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    // Se o gráfico já existe, destrua-o antes de criar um novo
    if (charts[canvasId]) {
        charts[canvasId].destroy();
    }
    
    charts[canvasId] = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: label,
                data: data,
                borderColor: '#007bff',
                backgroundColor: 'rgba(0, 123, 255, 0.1)',
                fill: true,
                tension: 0.3,
                pointRadius: 2,
                pointBackgroundColor: '#007bff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'hour',
                        tooltipFormat: 'dd/MM/yyyy HH:mm',
                        displayFormats: {
                            hour: 'HH:mm'
                        }
                    },
                    title: {
                        display: false
                    }
                },
                y: {
                    title: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Função para buscar dados de uma planilha específica
async function fetchSheetData(sheetName) {
    try {
        const response = await fetch(`${API_URL}?sheet=${sheetName}&limit=30`); // Pega os últimos 30 registros
        if (!response.ok) {
            throw new Error(`Erro de rede: ${response.statusText}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Falha ao buscar dados da planilha ${sheetName}:`, error);
        return []; // Retorna um array vazio em caso de erro
    }
}

// Função principal para atualizar o dashboard
async function updateDashboard() {
    console.log("Atualizando dashboard...");
    document.getElementById('last-updated').textContent = `Atualizando...`;

    for (const key in elements) {
        const config = elements[key];
        const data = await fetchSheetData(config.sheet);

        if (data.length > 0) {
            // Pega o valor mais recente
            const latestValue = parseFloat(data[data.length - 1].value).toFixed(1);
            document.getElementById(config.value).textContent = `${latestValue} ${config.unit}`;

            // Prepara os dados para o gráfico (x: timestamp, y: valor)
            const chartData = data.map(item => ({
                x: new Date(item.timestamp).getTime(),
                y: parseFloat(item.value)
            }));

            // Cria ou atualiza o gráfico
            createChart(config.chart, config.sheet, chartData);
        }
    }
    
    const now = new Date();
    document.getElementById('last-updated').textContent = `Última atualização: ${now.toLocaleTimeString('pt-BR')}`;
}

// Inicia o processo quando a página carrega e repete a cada 60 segundos
document.addEventListener('DOMContentLoaded', () => {
    updateDashboard(); // Primeira atualização imediata
    setInterval(updateDashboard, 60000); // Atualiza a cada 60 segundos
});
