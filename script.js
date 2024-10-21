// Dimensiones del mapa
const width = 800;
const height = 600;

// Crear el SVG
const svg = d3.select("#map").append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 ${height * 0} ${625} ${height}`);

// Proyección y path
const projection = d3.geoMercator()
    .center([0, 40])
    .scale(2000)
    .translate([width / 2, height / 2]);

const path = d3.geoPath().projection(projection);

// Cargar el archivo GeoJSON y los datos
Promise.all([
    d3.json("spain-provinces.geojson"),
    d3.json("output_nationality.json")
]).then(function([geojson, data]) {
    // Dibujar las provincias
    svg.selectAll("path")
        .data(geojson.features)
        .enter().append("path")
        .attr("class", "province")
        .attr("d", path)
        .attr("fill", "rgba(0, 0, 0, 0)"); 
        
// Función para crear la gráfica de línea
function createLineChart(data) {
    const selectedValues = getSelectedValues();
    const years = selectedValues.years.split(";");
    const sexes = selectedValues.sex === "Total" ? ["Hombres", "Mujeres"] : selectedValues.sex.split(";");
    const nationalities = selectedValues.nationality === "Total" ? ["Española", "Extranjera"] : selectedValues.nationality.split(";");

    const chartData = years.map(year => {
        const totalNational = getTotalCrimesByNationality(data, [year], sexes, ["Española"]);
        const totalForeign = getTotalCrimesByNationality(data, [year], sexes, ["Extranjera"]);
        return { year, totalNational, totalForeign };
    });

    const chartWidth = 1000;
    const chartHeight = 130;
    const margin = { top: 10, right: 10, bottom: 20, left: 50 };

    const x = d3.scaleBand()
        .domain(years)
        .range([margin.left, chartWidth - margin.right])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(chartData, d => Math.max(d.totalNational, d.totalForeign))]).nice()
        .range([chartHeight - margin.bottom, margin.top]);

    const svg = d3.select("#chart")
        .attr("viewBox", [0, 0, chartWidth, chartHeight]);

    svg.selectAll("*").remove(); // Limpiar el SVG antes de redibujar

    // Línea para nacionales
    const lineNational = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.totalNational));

    // Línea para extranjeros
    const lineForeign = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.totalForeign));

    svg.append("path")
        .datum(chartData)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", lineNational);

    svg.append("path")
        .datum(chartData)
        .attr("fill", "none")
        .attr("stroke", "red")
        .attr("stroke-width", 1.5)
        .attr("d", lineForeign);

    svg.append("g")
        .attr("transform", `translate(0,${chartHeight - margin.bottom})`)
        .call(d3.axisBottom(x));

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));
    
    // Añadir después de svg.append("path").datum(chartData).attr("fill", "none").attr("stroke", "red").attr("stroke-width", 1.5).attr("d", lineForeign);

    // Añadir la leyenda
    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${chartWidth - margin.right - 85}, ${margin.top})`);

    // Leyenda para nacionales
    legend.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", "steelblue");

    legend.append("text")
        .attr("x", 15)
        .attr("y", 10)
        .attr("fill", "white")
        .text("España");

    // Leyenda para extranjeros
    legend.append("rect")
        .attr("x", 0)
        .attr("y", 20)
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", "red");

    legend.append("text")
        .attr("x", 15)
        .attr("y", 30)
        .attr("fill", "white")
        .text("Extranjero");
}

// Función para calcular el total de delitos por nacionalidad
function getTotalCrimesByNationality(data, years, sexes, nationalities) {
    let total = 0;

    years.forEach(year => {
        const yearEntry = data[year];
        if (yearEntry) {
            for (const province in yearEntry) {
                sexes.forEach(sex => {
                    nationalities.forEach(nationality => {
                        if (yearEntry[province][sex] && yearEntry[province][sex][nationality]) {
                            total += parseInt(yearEntry[province][sex][nationality], 10);
                        }
                    });
                });
            }
        }
    });

    return total;
}

// Añadir eventos para actualizar la gráfica cuando se cambian las selecciones
document.querySelectorAll('.year-checkbox, .sex-checkbox, .nationality-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', function() {
        createLineChart(data);
    });
});

// Calcular y mostrar la gráfica inicial
createLineChart(data);

function getProvinceData(data, provinceName, year, sex, nationality) {
    let yearData = year.toString().split(";");
    
    if (year.length === 0) {
        // Si no se selecciona ningún año, usar todos los años disponibles en los datos
        yearData = Object.keys(data);
    } else {
        yearData = year.toString().split(";");
    }

    let total = 0;

    for (let i = 0; i < yearData.length; i++) {
        const yearEntry = data[yearData[i]];
        if (yearEntry && yearEntry[provinceName] && yearEntry[provinceName][sex] && yearEntry[provinceName][sex][nationality]) {
            total += parseInt(yearEntry[provinceName][sex][nationality], 10);
        }
    }
    
    return total;
    }
    
// Función para sumar el porcentaje de delitos cometidos por extranjeros del total
function getNationalityData(data, provinceName, year, sex) {
    let yearData = year.toString().split(";");
    
    if (year.length === 0) {
        yearData = Object.keys(data);
    } else {
        yearData = year.toString().split(";");
    }

    let total = 0;

    for (let i = 0; i < yearData.length; i++) {
        const yearEntry = data[yearData[i]];
        if (yearEntry && yearEntry[provinceName] && yearEntry[provinceName][sex] && yearEntry[provinceName][sex]["Extranjera"]) {
            total += parseInt(yearEntry[provinceName][sex]["Extranjera"], 10);
        }
    }
    
    return total;
    }
    


function generatePoints(province, numPoints, max) {
    const bounds = path.bounds(province);
    const points = [];
    const gridSpacing = 6;
    let probabilityOfPoint = 1 - numPoints / max; // Ajusta el 0.9 según tus datos
    bounds[0][0] -= bounds[0][0] % gridSpacing;
    bounds[0][1] -= bounds[0][1] % gridSpacing;
    bounds[1][0] += bounds[1][0] % gridSpacing;
    bounds[1][1] += bounds[1][1] % gridSpacing;
    for (let x = bounds[0][0]; x < bounds[1][0]; x += gridSpacing) {
        for (let y = bounds[0][1]; y < bounds[1][1]; y += gridSpacing) {
            if (Math.random() + 0.7 > probabilityOfPoint) {
                const point = [x, y];
                if (d3.geoContains(province, projection.invert(point))) {
                    points.push(point);
                }
                random = Math.random();
            }
        }
    }
    return points;
}

    
// Función para actualizar el mapa con puntos
function updateMap(data, years, sex, nationality) {
svg.selectAll("circle").remove();
// Calcular el maximo
let max = 0;
let min = 0;
svg.selectAll("path").each(function(d) {
    const provinceName = d.properties.name;
    const provinceData = getProvinceData(data, provinceName, years, sex, nationality);
    if (provinceData > max) {
        max = provinceData;
    }
    if (provinceData < min) {
        min = provinceData;
    }
});

console.log(`Max: ${max}`); // Depuración
console.log(`Min: ${min}`); // Depuración
svg.selectAll("path").each(function(d) {
    const provinceName = d.properties.name;
    const provinceData = getProvinceData(data, provinceName, years, sex, nationality);
    const numPoints = provinceData; // Ajusta el número de puntos según tus datos
    console.log(`Province: ${provinceName}, Points: ${numPoints}`); // Depuración

    // Escala de color para los puntos
    const colorScale = d3.scaleLinear()
        .domain([0, max])
        .range(["rgba(255, 200, 200, 1)", "rgba(140, 0, 0, 1)"])
        .clamp(true);

    const points = generatePoints(d, numPoints, max);
    svg.selectAll(`.point-${provinceName}`).remove(); // Eliminar puntos anteriores
    svg.selectAll(`.point-${provinceName}`)
        .data(points)
        .enter().append("circle")
        .attr("class", `point-${provinceName}`)
        .attr("cx", d => d[0])
        .attr("cy", d => d[1])
        .attr("r", 2)
        .attr("fill", d => {
            // Asegurarse de que numPoints esté dentro del rango
            const color = colorScale(numPoints);
            return color ? color : "rgba(0, 150, 0, 1)"; // Color por defecto si está fuera del rango
        });        
});
    }
    
function updatePercentage(data, years, sex, nationality) {
    let total = 0;
    let foreign = 0;
    svg.selectAll("path").each(function(d) {
        const provinceName = d.properties.name;
        const provinceData = getProvinceData(data, provinceName, years, sex, "Total");
        const provinceForeign = getNationalityData(data, provinceName, years, sex);
        const numPoints = provinceData; // Ajusta el número de puntos según tus datos
        console.log(`Province: ${provinceName}, Points: ${numPoints}`); // Depuración
        total += provinceData;
        foreign += provinceForeign;
        console.log(`Total: ${total}`); // Depuración
    });
    const percentage = foreign / total * 100;
    console.log(`Percentage: ${percentage}`); // Depuración
    d3.select("#percentage").text(percentage.toFixed(2) + "%");
}


const NUM_ANIMATED_POINTS = 70;

// Función para animar los puntos
function animetedCircles() {
    // Seleccionar todos los círculos
    const circles = svg.selectAll("circle");

    // Filtrar los círculos que ya están animados
    const animatedCircles = circles.filter(function() {
        return d3.select(this).attr("animating") === "true";
    });

    // Si hay menos de NUM_ANIMATED_POINTS animados, seleccionar más
    if (animatedCircles.size() < NUM_ANIMATED_POINTS) {
        const numToAnimate = NUM_ANIMATED_POINTS - animatedCircles.size();
        const unanimatedCircles = circles.filter(function() {
            return d3.select(this).attr("animating") !== "true";
        });

        // Seleccionar aleatoriamente numToAnimate círculos no animados
        unanimatedCircles.each(function(d, i, nodes) {
            if (Math.random() < numToAnimate / unanimatedCircles.size()) {
                d3.select(this)
                    .attr("animating", "true") // Marcar como animados
                    .transition()
                    .delay(() => Math.random() * 1000)
                    .duration(() => Math.random() * 500 + 500) // Duración aleatoria entre 500 y 2500 ms
                    .attr("opacity", 0.5)
                    .transition()
                    .delay(() => Math.random() * 500)
                    .duration(() => Math.random() * 500 + 500) // Duración aleatoria entre 500 y 2500 ms
                    .attr("opacity", 1)
                    .on("end", function() {
                        d3.select(this).attr("animating", null); // Desmarcar como animados
                    });
            }
        });
    }
}

// Usar d3.interval para ejecutar la función de animación continuamente
d3.interval(animetedCircles, 1000);

// Función para obtener los valores seleccionados de los checkboxes
function getSelectedValues() {
    const selectedYears = d3.selectAll(".year-checkbox:checked")
        .nodes()
        .map(node => node.value)
        .join(";");
    let selectedSex = d3.selectAll(".sex-checkbox:checked")
        .nodes()
        .map(node => node.value);
    if (selectedSex.length === 2 || selectedSex.length === 0) { 
        selectedSex = "Total";
    } else {
        selectedSex = selectedSex.join(";");
    }
    let selectedNationality = d3.selectAll(".nationality-checkbox:checked")
        .nodes()
        .map(node => node.value);
    if (selectedNationality.length === 2 || selectedNationality.length === 0) { 
        selectedNationality = "Total";
    } else {
        selectedNationality = selectedNationality.join(";");
    }

    return {
        years: selectedYears,
        sex: selectedSex,
        nationality: selectedNationality
    };
}

// Inicializar el mapa con todos los valores seleccionados
const initialValues = getSelectedValues();

    updateMap(data, initialValues.years, initialValues.sex, initialValues.nationality);
    updatePercentage(data, initialValues.years, initialValues.sex, initialValues.nationality);
    animetedCircles();

// Escuchar cambios en los checkboxes
d3.selectAll(".year-checkbox, .sex-checkbox, .nationality-checkbox").on("change", function() {
    const selectedValues = getSelectedValues();
    updateMap(data, selectedValues.years, selectedValues.sex, selectedValues.nationality);
    updatePercentage(data, selectedValues.years, selectedValues.sex, selectedValues.nationality)
});
});
