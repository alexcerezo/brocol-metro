// Dimensiones del mapa
const width = 800;
const height = 600;

// Crear el SVG
const svg = d3.select("#map").append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 ${height * 0} ${width} ${height * 1}`);

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
        


function getProvinceData(data, provinceName, year, sex, nationality) {
    const yearData = year.toString().split(";");
    let total = 0;

    for (let i = 0; i < yearData.length; i++) {
        const yearEntry = data[yearData[i]];
        if (yearEntry && yearEntry[provinceName] && yearEntry[provinceName][sex] && yearEntry[provinceName][sex][nationality]) {
            total += parseInt(yearEntry[provinceName][sex][nationality], 10);
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
        .domain([min, max])
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

// Función para animar los puntos
function animetedCircles() {
    svg.selectAll("circle")
    // Bajar la opacidad con un delay aleatorio para cada circulo
        .transition()
        .delay(d => Math.random() * 500)
        .duration(500)
        .attr("r", 5)
        .transition()
        .duration(500)
        .attr("r", 2)
        .on("end", animetedCircles);
}

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
    animetedCircles();

// Escuchar cambios en los checkboxes
d3.selectAll(".year-checkbox, .sex-checkbox, .nationality-checkbox").on("change", function() {
    const selectedValues = getSelectedValues();
    updateMap(data, selectedValues.years, selectedValues.sex, selectedValues.nationality);
});
});