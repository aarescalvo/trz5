#!/bin/bash

# SIMULACIÓN COMPLETA DE PESAJES V2 - Con datos completos
BASE_URL="http://localhost:3000/api"
ERRORS=0
SUCCESSES=0

echo "========================================="
echo "   SIMULACIÓN DE PESAJES Y TROPA V2"
echo "   $(date)"
echo "========================================="

log_result() {
    local test_name=$1
    local expected=$2
    local actual=$3
    local details=$4
    
    if [ "$actual" = "$expected" ]; then
        echo "✅ $test_name"
        SUCCESSES=$((SUCCESSES + 1))
    else
        echo "❌ $test_name: Esperado $expected, Obtenido $actual"
        if [ -n "$details" ]; then
            echo "   Detalle: $(echo "$details" | head -c 300)"
        fi
        ERRORS=$((ERRORS + 1))
    fi
}

echo ""
echo "=== PREPARACIÓN: DATOS BASE ==="

# Login admin
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth" \
    -H "Content-Type: application/json" \
    -d '{"usuario":"admin","password":"admin123"}')
ADMIN_ID=$(echo "$LOGIN_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Admin ID: $ADMIN_ID"

# Crear cliente (productor y usuario faena)
TIMESTAMP=$(date +%s)
CLIENTE_RESPONSE=$(curl -s -X POST "$BASE_URL/clientes" \
    -H "Content-Type: application/json" \
    -d "{\"nombre\":\"PRODUCTOR TEST $TIMESTAMP\",\"cuit\":\"27-${TIMESTAMP:0:8}-5\",\"esProductor\":true,\"esUsuarioFaena\":true}")
CLIENTE_ID=$(echo "$CLIENTE_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Cliente ID: $CLIENTE_ID"

# Crear corral
CORRAL_RESPONSE=$(curl -s -X POST "$BASE_URL/corrales" \
    -H "Content-Type: application/json" \
    -d "{\"nombre\":\"CORRAL TEST $TIMESTAMP\",\"capacidad\":100}")
CORRAL_ID=$(echo "$CORRAL_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Corral ID: $CORRAL_ID"

echo ""
echo "========================================="
echo "   1. PESAJE CAMIÓN - INGRESO HACIENDA"
echo "   (Con creación automática de tropa)"
echo "========================================="

# Crear pesaje de camión CON usuarioFaenaId y todos los datos
echo ""
echo "--- Creando pesaje con tropa ---"
PESAJE_RESPONSE=$(curl -s -X POST "$BASE_URL/pesaje-camion" \
    -H "Content-Type: application/json" \
    -d "{
        \"tipo\": \"INGRESO_HACIENDA\",
        \"patenteChasis\": \"AB123CD\",
        \"chofer\": \"Juan Pérez\",
        \"dniChofer\": \"12345678\",
        \"productorId\": \"$CLIENTE_ID\",
        \"usuarioFaenaId\": \"$CLIENTE_ID\",
        \"especie\": \"BOVINO\",
        \"dte\": \"DTE-$TIMESTAMP\",
        \"guia\": \"GUIA-$TIMESTAMP\",
        \"cantidadCabezas\": 10,
        \"corralId\": \"$CORRAL_ID\",
        \"tiposAnimales\": [
            {\"tipoAnimal\": \"NO\", \"cantidad\": 5},
            {\"tipoAnimal\": \"VA\", \"cantidad\": 5}
        ],
        \"pesoBruto\": 25000,
        \"operadorId\": \"$ADMIN_ID\"
    }")

PESAJE_SUCCESS=$(echo "$PESAJE_RESPONSE" | grep -o '"success":[^,}]*' | head -1 | cut -d':' -f2)
PESAJE_ID=$(echo "$PESAJE_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
TROPA_ID=$(echo "$PESAJE_RESPONSE" | grep -o '"tropaId":"[^"]*"' | cut -d'"' -f4)
TROPA_CODIGO=$(echo "$PESAJE_RESPONSE" | grep -o '"codigo":"B[^"]*"' | head -1 | cut -d'"' -f4)
ANIMALES_CREADOS=$(echo "$PESAJE_RESPONSE" | grep -o '"animalesCreados":[0-9]*' | cut -d':' -f2)

log_result "Crear pesaje con tropa" "true" "$PESAJE_SUCCESS" "$PESAJE_RESPONSE"
echo "   Pesaje ID: $PESAJE_ID"
echo "   Tropa ID: $TROPA_ID"
echo "   Código tropa: $TROPA_CODIGO"
echo "   Animales creados: $ANIMALES_CREADOS"

# Verificar que la tropa tiene los datos correctos
if [ -n "$TROPA_ID" ]; then
    echo ""
    echo "--- Verificando tropa creada ---"
    TROPA_CHECK=$(curl -s "$BASE_URL/tropas")
    TIENE_TROPA=$(echo "$TROPA_CHECK" | grep -c "$TROPA_CODIGO")
    if [ "$TIENE_TROPA" -gt 0 ]; then
        echo "✅ Tropa $TROPA_CODIGO encontrada en lista"
        SUCCESSES=$((SUCCESSES + 1))
    else
        echo "❌ Tropa NO encontrada en lista"
        ERRORS=$((ERRORS + 1))
    fi
    
    # Verificar animales creados
    ANIMALES_EN_TROPA=$(curl -s "$BASE_URL/animales?tropaId=$TROPA_ID")
    NUM_ANIMALES=$(echo "$ANIMALES_EN_TROPA" | grep -o '"numero":[0-9]*' | wc -l)
    echo "   Animales en tropa: $NUM_ANIMALES"
fi

echo ""
echo "========================================="
echo "   2. PESAJE PARTICULAR"
echo "========================================="

PESAJE2_RESPONSE=$(curl -s -X POST "$BASE_URL/pesaje-camion" \
    -H "Content-Type: application/json" \
    -d "{
        \"tipo\": \"PESAJE_PARTICULAR\",
        \"patenteChasis\": \"CD456EF\",
        \"chofer\": \"Particular Test\",
        \"observaciones\": \"Pesaje particular de prueba\",
        \"pesoBruto\": 5000,
        \"pesoTara\": 2000,
        \"operadorId\": \"$ADMIN_ID\"
    }")

PESAJE2_SUCCESS=$(echo "$PESAJE2_RESPONSE" | grep -o '"success":[^,}]*' | head -1 | cut -d':' -f2)
PESAJE2_ID=$(echo "$PESAJE2_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
log_result "Crear pesaje particular" "true" "$PESAJE2_SUCCESS"

# Verificar que NO tiene tropa asociada
TROPA_EN_PARTICULAR=$(echo "$PESAJE2_RESPONSE" | grep -o '"tropa":null' | head -1)
if [ -n "$TROPA_EN_PARTICULAR" ]; then
    echo "✅ Pesaje particular sin tropa (correcto)"
    SUCCESSES=$((SUCCESSES + 1))
else
    echo "❌ Pesaje particular no debería tener tropa"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "========================================="
echo "   3. SALIDA DE MERCADERÍA"
echo "========================================="

PESAJE3_RESPONSE=$(curl -s -X POST "$BASE_URL/pesaje-camion" \
    -H "Content-Type: application/json" \
    -d "{
        \"tipo\": \"SALIDA_MERCADERIA\",
        \"patenteChasis\": \"EF789GH\",
        \"chofer\": \"Chofer Salida\",
        \"destino\": \"Cliente Mayorista\",
        \"remito\": \"RTO-$TIMESTAMP\",
        \"factura\": \"FAC-$TIMESTAMP\",
        \"precintos\": \"P001,P002\",
        \"pesoBruto\": 12000,
        \"pesoTara\": 4000,
        \"operadorId\": \"$ADMIN_ID\"
    }")

PESAJE3_SUCCESS=$(echo "$PESAJE3_RESPONSE" | grep -o '"success":[^,}]*' | head -1 | cut -d':' -f2)
PESAJE3_ID=$(echo "$PESAJE3_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
log_result "Crear salida de mercadería" "true" "$PESAJE3_SUCCESS"

# Verificar que NO tiene tropa (es salida, no ingreso)
TROPA_EN_SALIDA=$(echo "$PESAJE3_RESPONSE" | grep -o '"tropa":null' | head -1)
if [ -n "$TROPA_EN_SALIDA" ]; then
    echo "✅ Salida sin tropa (correcto)"
    SUCCESSES=$((SUCCESSES + 1))
else
    echo "❌ Salida no debería tener tropa de hacienda"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "========================================="
echo "   4. VERIFICACIÓN FINAL"
echo "========================================="

# Listar todos los pesajes
echo ""
echo "--- Resumen de pesajes ---"
LIST_PESAJES=$(curl -s "$BASE_URL/pesaje-camion")
INGRESOS=$(echo "$LIST_PESAJES" | grep -o '"tipo":"INGRESO_HACIENDA"' | wc -l)
PARTICULARES=$(echo "$LIST_PESAJES" | grep -o '"tipo":"PESAJE_PARTICULAR"' | wc -l)
SALIDAS=$(echo "$LIST_PESAJES" | grep -o '"tipo":"SALIDA_MERCADERIA"' | wc -l)
echo "   Pesajes de ingreso hacienda: $INGRESOS"
echo "   Pesajes particulares: $PARTICULARES"
echo "   Salidas de mercadería: $SALIDAS"

# Listar tropas
echo ""
echo "--- Resumen de tropas ---"
LIST_TROPAS=$(curl -s "$BASE_URL/tropas")
NUM_TROPAS=$(echo "$LIST_TROPAS" | grep -o '"id":"[^"]*"' | wc -l)
echo "   Total tropas: $NUM_TROPAS"

echo ""
echo "========================================="
echo "           RESUMEN FINAL"
echo "========================================="
echo "Pruebas exitosas: $SUCCESSES"
echo "Pruebas fallidas: $ERRORS"
echo "Total pruebas: $((SUCCESSES + ERRORS))"
if [ $ERRORS -eq 0 ]; then
    echo "🎉 ¡TODAS LAS PRUEBAS PASARON!"
else
    echo "⚠️ Hay $ERRORS errores que requieren atención"
fi
echo "========================================="

exit $ERRORS
