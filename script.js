document.addEventListener('DOMContentLoaded', () => {
    
    // --- LÓGICA DE ANIMACIÓN SCROLL REVEAL ---
    function checkReveal() {
        const reveals = document.querySelectorAll('.reveal');
        const triggerBottom = window.innerHeight * 0.85;

        reveals.forEach(reveal => {
            const revealTop = reveal.getBoundingClientRect().top;
            if (revealTop < triggerBottom) {
                reveal.classList.add('active');
            }
        });
    }
    checkReveal();
    window.addEventListener('scroll', checkReveal);

    // --- MOTOR DE CÁLCULO DE PLANIFICACIÓN ASIMÉTRICA ---
    const calcBtn = document.getElementById('calc-btn');
    if (calcBtn) {
        calcBtn.addEventListener('click', () => {
            const sqmeters = parseFloat(document.getElementById('sqmeters').value);
            
            if (isNaN(sqmeters) || sqmeters <= 0) {
                alert("Por favor, introduce un valor válido de metros cuadrados.");
                return;
            }

            // Radio con jumper cables = 1.0 metro
            // Área de un círculo = π * r² = 3.1416 * 1² = 3.1416 m²
            // Ajustando por solape técnico en cuadrícula, estimamos que cada sensor individual (sea central o satélite) 
            // cubre de forma óptima un área de muestreo de 1.5 m² a la redonda.
            const areaPerSensor = 1.5;
            
            // Total de puntos de lectura de datos requeridos en el terreno
            let totalPointsRequired = Math.ceil(sqmeters / areaPerSensor);
            if (totalPointsRequired < 1) totalPointsRequired = 1;

            let remainingPoints = totalPointsRequired;
            let clusterList = []; // Aquí guardaremos la configuración de cada nodo

            // Distribuir los puntos en clústeres (1 central + hasta 3 satélites)
            while (remainingPoints > 0) {
                // Cada clúster necesita obligatoriamente 1 nodo central (gasta 1 punto)
                remainingPoints -= 1;
                let satForThisNode = 0;

                // Si quedan puntos disponibles, se asignan como satélites (máximo 3)
                if (remainingPoints >= 3) {
                    satForThisNode = 3;
                    remainingPoints -= 3;
                } else if (remainingPoints > 0) {
                    satForThisNode = remainingPoints; // Puede ser 1 o 2 satélites para el último nodo
                    remainingPoints = 0;
                }

                clusterList.push({
                    id: clusterList.length + 1,
                    satellites: satForThisNode
                });
            }

            // Conteo total de hardware
            const totalNodes = clusterList.length;
            let totalSatellites = 0;
            clusterList.forEach(c => totalSatellites += c.satellites);

            // Costos comerciales
            const costNode = 45000;
            const costSatellite = 7500;
            const totalCost = (totalNodes * costNode) + (totalSatellites * costSatellite);
            
            // Comparativa tradicional (Si cada punto de lectura requiriera un ESP32 central independiente de $45.000)
            const traditionalCost = (totalNodes + totalSatellites) * costNode;
            const absoluteSavings = traditionalCost - totalCost;

            // Inyectar datos en el DOM
            document.getElementById('res-nodes').textContent = totalNodes;
            document.getElementById('res-satellites').textContent = totalSatellites;
            document.getElementById('res-cost').textContent = `$${totalCost.toLocaleString('es-CL')} CLP`;
            document.getElementById('res-savings').textContent = `$${absoluteSavings.toLocaleString('es-CL')} CLP`;

            // --- RE-RENDERIZAR EL DIAGRAMA DE FORMA TOTALMENTE DINÁMICA ---
            const meshGrid = document.getElementById('mesh-grid');
            meshGrid.innerHTML = ''; // Limpiar grilla previa

            clusterList.forEach(cluster => {
                const unit = document.createElement('div');
                
                // Si el nodo no tiene los 3 satélites, le ponemos una clase visual distinta (dashed)
                const isPartial = cluster.telemetry === 3 ? "" : " partial";
                unit.className = `cluster-unit${isPartial} anim-fade-in`;
                
                // Generar los círculos de los satélites según el cálculo exacto
                let satDotsHtml = '';
                for (let i = 0; i < cluster.satellites; i++) {
                    satDotsHtml += `<div class="satellite-dot" title="Satélite auxiliar"></div>`;
                }

                unit.innerHTML = `
                    <div class="node-core" title="AgroNode Central (ESP32)"></div>
                    <div class="satellite-dots-container">
                        ${satDotsHtml || '<span style="color:#999; font-size:0.65rem;">Sin extensiones</span>'}
                    </div>
                    <span>Clúster ${cluster.id}</span>
                    <small style="font-size:0.65rem; color:#555; font-weight:600;">
                        1 Central + ${cluster.satellites} Sat
                    </small>
                `;
                meshGrid.appendChild(unit);
            });
        });

        // Ejecutar un cálculo por defecto (12 m²) al cargar la vista
        calcBtn.click();
    }
});
