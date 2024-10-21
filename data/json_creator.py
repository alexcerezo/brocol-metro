import xml.etree.ElementTree as ET
import json

# Leer y parsear el archivo XML
tree = ET.parse('datos_edad.xml')
root = tree.getroot()

# Inicializar la estructura de datos
data = {}

# Crear un diccionario para mapear los valueId con sus correspondientes textlang
value_map = {}
for value in root.findall('.//value'):
    value_id = value.get('valueId')
    textlang = value.find('.//textlang').text
    value_map[value_id] = textlang

# Iterar sobre los elementos del XML
for element in root.findall('.//cell'):
    cell_id_refs = element.get('cellIdRefs').split()
    if len(cell_id_refs) == 4:
        var1, var2, var3, var4 = cell_id_refs
        cell_value = element.text
        
        # Obtener los textos correspondientes
        var1_text = value_map.get(var1, var1)
        var2_text = value_map.get(var2, var2)
        var3_text = value_map.get(var3, var3)
        var4_text = value_map.get(var4, var4)
        
        # Clasificar los datos
        if var4_text not in data:
            data[var4_text] = {}
        if var1_text not in data[var4_text]:
            data[var4_text][var1_text] = {}
        if var2_text not in data[var4_text][var1_text]:
            data[var4_text][var1_text][var2_text] = {}
        if var3_text not in data[var4_text][var1_text][var2_text]:
            data[var4_text][var1_text][var2_text][var3_text] = cell_value

# Convertir el diccionario a JSON
json_data = json.dumps(data, indent=4, ensure_ascii=False)

# Guardar el JSON en un archivo
with open('output.json', 'w', encoding='utf-8') as json_file:
    json_file.write(json_data)

print("Datos clasificados y guardados en output.json")