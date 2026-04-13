#!/bin/bash

# SIMULACIÓN COMPLETA DE PESAJES
BASE_URL="http://localhost:3000/api"
ERRORS=0
SUCCESSES=0

echo "========================================="
echo "   SIMULACIÓN DE PESAJES Y TROPA"
echo "   $(date)"
echo "========================================="

# Función para registrar resultado
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
            echo "   Detalle: $details"
        fi
        ERRORS=$((ERRORS + 1))
    fi
}

echo ""
echo "=== PREPARACIÓN: LOGIN Y DATOS BASE ==="

# Login admin
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth" \
    -H "Content-Type: application/json" \
    -d '{"usuario":"admin","password":"admin123"}')
ADMIN_ID=$(echo "$LOGIN_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Admin ID: $ADMIN_ID"

# Crear cliente si no existe uno
CLIENTE_RESPONSE=$(curl -s -X POST "$BASE_URL/clientes" \
    -H "Content-Type: application/json" \
    -d "{\"nombre\":\"PRODUCTOR PESAJE SIM $(date +%s)\",\"cuit\":\"27-$(shuf -i 10000000-99999999 -n 1)-5\",\"esProductor\":true,\"esUsuarioFaena\":true}")
CLIENTE_ID=$(echo "$CLIENTE_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Cliente ID: $CLIENTE_ID"

# Crear corral
CORRAL_RESPONSE=$(curl -s -X POST "$BASE_URL/corrales" \
    -H "Content-Type: application/json" \
    -d "{\"nombre\":\"CORRAL PESAJE $(date +%s)\",\"capacidad\":100}")
CORRAL_ID=$(echo "$CORRAL_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Corral ID: $CORRAL_ID"

# Crear transportista
TRANS_RESPONSE=$(curl -s -X POST "$BASE_URL/transportistas" \
    -H "Content-Type: application/json" \
    -d "{\"nombre\":\"TRANSPORTISTA SIM $(date +%s)\",\"cuit\":\"30-$(shuf -i 10000000-99999999 -n 1)-2\"}")
TRANS_ID=$(echo "$TRANS_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Transportista ID: $TRANS_ID"

echo ""
echo "========================================="
echo "   1. PESAJE DE CAMIÓN - INGRESO HACIENDA"
echo "========================================="

# Paso 1: Crear pesaje de camión (INGRESO HACIENDA)
echo ""
echo "--- Paso 1: Crear pesaje de camión ---"
PESAJE1_RESPONSE=$(curl -s -X POST "$BASE_URL/pesaje-camion" \
    -H "Content-Type: application/json" \
    -d "{
        \"tipo\": \"INGRESO_HACIENDA\",
        \"patenteChasis\": \"AB123CD\",
        \"patenteAcoplado\": \"EF456GH\",
        \"choferNombre\": \"Juan Pérez\",
        \"choferDni\": \"12345678\",
        \"transportistaId\": \"$TRANS_ID\",
        \"operadorId\": \"$ADMIN_ID\"
    }")

PESAJE1_SUCCESS=$(echo "$PESAJE1_RESPONSE" | grep -o '"success":[^,}]*' | cut -d':' -f2)
PESAJE1_ID=$(echo "$PESAJE1_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
PESAJE1_NUMERO=$(echo "$PESAJE1_RESPONSE" | grep -o '"numeroTicket":[0-9]*' | cut -d':' -f2)
log_result "Crear pesaje camión (INGRESO_HACIENDA)" "true" "$PESAJE1_SUCCESS" "$PESAJE1_RESPONSE"
echo "   Pesaje ID: $PESAJE1_ID"
echo "   Ticket N°: $PESAJE1_NUMERO"

# Paso 2: Registrar peso bruto
echo ""
echo "--- Paso 2: Registrar peso bruto (camión cargado) ---"
PESO_BRUTO_RESPONSE=$(curl -s -X PUT "$BASE_URL/pesaje-camion" \
    -H "Content-Type: application/json" \
    -d "{
        \"id\": \"$PESAJE1_ID\",
        \"pesoBruto\": 25000
    }")
PESO_BRUTO_SUCCESS=$(echo "$PESO_BRUTO_RESPONSE" | grep -o '"success":[^,}]*' | cut -d':' -f2)
log_result "Registrar peso bruto (25000 kg)" "true" "$PESO_BRUTO_SUCCESS"

# Paso 3: Registrar peso tara
echo ""
echo "--- Paso 3: Registrar peso tara (camión vacío) ---"
PESO_TARA_RESPONSE=$(curl -s -X PUT "$BASE_URL/pesaje-camion" \
    -H "Content-Type: application/json" \
    -d "{
        \"id\": \"$PESAJE1_ID\",
        \"pesoTara\": 8000
    }")
PESO_TARA_SUCCESS=$(echo "$PESO_TARA_RESPONSE" | grep -o '"success":[^,}]*' | cut -d':' -f2)
log_result "Registrar peso tara (8000 kg)" "true" "$PESO_TARA_SUCCESS"

# Paso 4: Crear tropa desde el pesaje
echo ""
echo "--- Paso 4: Crear tropa asociada al pesaje ---"
TROPA_RESPONSE=$(curl -s -X POST "$BASE_URL/pesaje-camion/$PESAJE1_ID/tropa" \
    -H "Content-Type: application/json" \
    -d "{
        \"productorId\": \"$CLIENTE_ID\",
        \"usuarioFaenaId\": \"$CLIENTE_ID\",
        \"especie\": \"BOVINO\",
        \"dte\": \"DTE-$(date +%s)\",
        \"guia\": \"GUIA-$(date +%s)\",
        \"cantidadCabezas\": 15,
        \"corralId\": \"$CORRAL_ID\",
        \"operadorId\": \"$ADMIN_ID\"
    }" 2>/dev/null)

# Si no existe ese endpoint, probar con el endpoint alternativo
if [ -z "$TROPA_RESPONSE" ] || echo "$TROPA_RESPONSE" | grep -q "404\|405"; then
    echo "   Endpoint /pesaje-camion/id/tropa no existe, probando alternativa..."
    TROPA_RESPONSE=$(curl -s -X POST "$BASE_URL/tropas" \
        -H "Content-Type: application/json" \
        -d "{
            \"productorId\": \"$CLIENTE_ID\",
            \"usuarioFaenaId\": \"$CLIENTE_ID\",
            \"especie\": \"BOVINO\",
            \"dte\": \"DTE-$(date +%s)\",
            \"guia\": \"GUIA-$(date +%s)\",
            \"cantidadCabezas\": 15,
            \"corralId\": \"$CORRAL_ID\",
            \"pesajeCamionId\": \"$PESAJE1_ID\",
            \"pesoBruto\": 17000,
            \"operadorId\": \"$ADMIN_ID\"
        }")
fi

TROPA_SUCCESS=$(echo "$TROPA_RESPONSE" | grep -o '"success":[^,}]*' | cut -d':' -f2)
TROPA_ID=$(echo "$TROPA_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
TROPA_CODIGO=$(echo "$TROPA_RESPONSE" | grep -o '"codigo":"[^"]*"' | cut -d'"' -f4)
log_result "Crear tropa asociada" "true" "$TROPA_SUCCESS" "$TROPA_RESPONSE"
echo "   Tropa ID: $TROPA_ID"
echo "   Código: $TROPA_CODIGO"

echo ""
echo "========================================="
echo "   2. PESAJE PARTICULAR"
echo "========================================="

echo ""
echo "--- Crear pesaje particular ---"
PESAJE2_RESPONSE=$(curl -s -X POST "$BASE_URL/pesaje-camion" \
    -H "Content-Type: application/json" \
    -d "{
        \"tipo\": \"PESAJE_PARTICULAR\",
        \"patenteChasis\": \"CD789EF\",
        \"choferNombre\": \"María García\",
        \"observaciones\": \"Pesaje particular de prueba\",
        \"operadorId\": \"$ADMIN_ID\"
    }")

PESAJE2_SUCCESS=$(echo "$PESAJE2_RESPONSE" | grep -o '"success":[^,}]*' | cut -d':' -f2)
PESAJE2_ID=$(echo "$PESAJE2_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
log_result "Crear pesaje particular" "true" "$PESAJE2_SUCCESS" "$PESAJE2_RESPONSE"

# Registrar pesos en pesaje particular
echo ""
echo "--- Registrar pesos en pesaje particular ---"
PESAJE2_PESO_RESPONSE=$(curl -s -X PUT "$BASE_URL/pesaje-camion" \
    -H "Content-Type: application/json" \
    -d "{
        \"id\": \"$PESAJE2_ID\",
        \"pesoBruto\": 5000,
        \"pesoTara\": 2000
    }")
PESAJE2_PESO_SUCCESS=$(echo "$PESAJE2_PESO_RESPONSE" | grep -o '"success":[^,}]*' | cut -d':' -f2)
log_result "Registrar pesos particular" "true" "$PESAJE2_PESO_SUCCESS"

echo ""
echo "========================================="
echo "   3. SALIDA DE MERCADERÍA"
echo "========================================="

echo ""
echo "--- Crear pesaje de salida ---"
PESAJE3_RESPONSE=$(curl -s -X POST "$BASE_URL/pesaje-camion" \
    -H "Content-Type: application/json" \
    -d "{
        \"tipo\": \"SALIDA_MERCADERIA\",
        \"patenteChasis\": \"GH012IJ\",
        \"choferNombre\": \"Pedro López\",
        \"destino\": \"Cliente Mayorista\",
        \"remito\": \"RTO-$(date +%s)\",
        \"factura\": \"FAC-$(date +%s)\",
        \"precintos\": \"P001,P002,P003\",
        \"operadorId\": \"$ADMIN_ID\"
    }")

PESAJE3_SUCCESS=$(echo "$PESAJE3_RESPONSE" | grep -o '"success":[^,}]*' | cut -d':' -f2)
PESAJE3_ID=$(echo "$PESAJE3_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
log_result "Crear salida de mercadería" "true" "$PESAJE3_SUCCESS" "$PESAJE3_RESPONSE"

# Registrar pesos salida
echo ""
echo "--- Registrar pesos en salida ---"
PESAJE3_PESO_RESPONSE=$(curl -s -X PUT "$BASE_URL/pesaje-camion" \
    -H "Content-Type: application/json" \
    -d "{
        \"id\": \"$PESAJE3_ID\",
        \"pesoBruto\": 12000,
        \"pesoTara\": 4000
    }")
PESAJE3_PESO_SUCCESS=$(echo "$PESAJE3_PESO_RESPONSE" | grep -o '"success":[^,}]*' | cut -d':' -f2)
log_result "Registrar pesos salida" "true" "$PESAJE3_PESO_SUCCESS"

echo ""
echo "========================================="
echo "   4. VERIFICACIÓN - CONSULTAR PESAJES"
echo "========================================="

# Verificar pesajes creados
echo ""
echo "--- Listar todos los pesajes ---"
LIST_PESAJES=$(curl -s "$BASE_URL/pesaje-camion")
LIST_SUCCESS=$(echo "$LIST_PESAJES" | grep -o '"success":[^,}]*' | cut -d':' -f2)
log_result "Listar pesajes" "true" "$LIST_SUCCESS"

# Contar pesajes por tipo
INGRESOS=$(echo "$LIST_PESAJES" | grep -o '"tipo":"INGRESO_HACIENDA"' | wc -l)
PARTICULARES=$(echo "$LIST_PESAJES" | grep -o '"tipo":"PESAJE_PARTICULAR"' | wc -l)
SALIDAS=$(echo "$LIST_PESAJES" | grep -o '"tipo":"SALIDA_MERCADERIA"' | wc -l)

echo "   Pesajes de ingreso hacienda: $INGRESOS"
echo "   Pesajes particulares: $PARTICULARES"
echo "   Salidas de mercadería: $SALIDAS"

echo ""
echo "========================================="
echo "   5. VERIFICACIÓN DE TROPAS"
echo "========================================="

# Verificar tropa creada
echo ""
echo "--- Listar tropas ---"
LIST_TROPAS=$(curl -s "$BASE_URL/tropas")
TROPAS_SUCCESS=$(echo "$LIST_TROPAS" | grep -o '"success":[^,}]*' | cut -d':' -f2)
log_result "Listar tropas" "true" "$TROPAS_SUCCESS"

# Verificar que la tropa tiene pesajeCamionId
if [ -n "$TROPA_ID" ]; then
    TROPA_DETALLE=$(curl -s "$BASE_URL/tropas/$TROPA_ID" 2>/dev/null || echo "{}")
    TIENE_PESAJE=$(echo "$TROPA_DETALLE" | grep -o '"pesajeCamionId":"[^"]*"' | head -1)
    if [ -n "$TIENE_PESAJE" ]; then
        echo "✅ Tropa tiene pesajeCamionId asociado"
        SUCCESSES=$((SUCCESSES + 1))
    else
        echo "❌ Tropa NO tiene pesajeCamionId asociado"
        ERRORS=$((ERRORS + 1))
    fi
fi

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
