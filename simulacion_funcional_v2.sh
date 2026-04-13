#!/bin/bash

# SIMULACIÓN FUNCIONAL COMPLETA V2 - Con correcciones
BASE_URL="http://localhost:3000/api"
ERRORS=0
SUCCESSES=0

echo "========================================="
echo "   SIMULACIÓN FUNCIONAL V2"
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
echo "=== 1. AUTENTICACIÓN ==="

# Login como admin
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth" \
    -H "Content-Type: application/json" \
    -d '{"usuario":"admin","password":"admin123"}')

ADMIN_ID=$(echo "$LOGIN_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
LOGIN_SUCCESS=$(echo "$LOGIN_RESPONSE" | grep -o '"success":[^,}]*' | cut -d':' -f2)
log_result "Login admin" "true" "$LOGIN_SUCCESS"

echo ""
echo "=== 2. CONFIGURACIÓN ==="

# Crear corral
CORRAL_RESPONSE=$(curl -s -X POST "$BASE_URL/corrales" \
    -H "Content-Type: application/json" \
    -d "{\"nombre\":\"CORRAL SIM $(date +%s)\",\"capacidad\":50}")
CORRAL_SUCCESS=$(echo "$CORRAL_RESPONSE" | grep -o '"success":[^,}]*' | cut -d':' -f2)
CORRAL_ID=$(echo "$CORRAL_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
log_result "Crear corral" "true" "$CORRAL_SUCCESS"

# Crear cliente
CLIENTE_RESPONSE=$(curl -s -X POST "$BASE_URL/clientes" \
    -H "Content-Type: application/json" \
    -d "{\"nombre\":\"CLIENTE SIM $(date +%s)\",\"cuit\":\"20-$(shuf -i 10000000-99999999 -n 1)-9\",\"esProductor\":true,\"esUsuarioFaena\":true}")
CLIENTE_SUCCESS=$(echo "$CLIENTE_RESPONSE" | grep -o '"success":[^,}]*' | cut -d':' -f2)
CLIENTE_ID=$(echo "$CLIENTE_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
log_result "Crear cliente" "true" "$CLIENTE_SUCCESS"

# Crear cámara
CAMARA_RESPONSE=$(curl -s -X POST "$BASE_URL/camaras" \
    -H "Content-Type: application/json" \
    -d "{\"nombre\":\"CAMARA SIM $(date +%s)\",\"tipo\":\"FAENA\",\"capacidad\":1000}")
CAMARA_SUCCESS=$(echo "$CAMARA_RESPONSE" | grep -o '"success":[^,}]*' | cut -d':' -f2)
CAMARA_ID=$(echo "$CAMARA_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
log_result "Crear cámara" "true" "$CAMARA_SUCCESS"

echo ""
echo "=== 3. PESAJE Y TROPA ==="

# Crear pesaje
PESAJE_RESPONSE=$(curl -s -X POST "$BASE_URL/pesaje-camion" \
    -H "Content-Type: application/json" \
    -d "{\"tipo\":\"INGRESO_HACIENDA\",\"patenteChasis\":\"AB$(date +%s | tail -c 4)CD\",\"operadorId\":\"$ADMIN_ID\"}")
PESAJE_SUCCESS=$(echo "$PESAJE_RESPONSE" | grep -o '"success":[^,}]*' | cut -d':' -f2)
PESAJE_ID=$(echo "$PESAJE_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
log_result "Crear pesaje" "true" "$PESAJE_SUCCESS"

# Crear tropa (si tenemos cliente y corral)
if [ -n "$CLIENTE_ID" ] && [ -n "$CORRAL_ID" ]; then
    TROPA_RESPONSE=$(curl -s -X POST "$BASE_URL/tropas" \
        -H "Content-Type: application/json" \
        -d "{\"productorId\":\"$CLIENTE_ID\",\"usuarioFaenaId\":\"$CLIENTE_ID\",\"especie\":\"BOVINO\",\"dte\":\"DTE-$(date +%s)\",\"guia\":\"GUIA-$(date +%s)\",\"cantidadCabezas\":5,\"corralId\":\"$CORRAL_ID\",\"operadorId\":\"$ADMIN_ID\"}")
    TROPA_SUCCESS=$(echo "$TROPA_RESPONSE" | grep -o '"success":[^,}]*' | cut -d':' -f2)
    TROPA_ID=$(echo "$TROPA_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    log_result "Crear tropa" "true" "$TROPA_SUCCESS"
fi

echo ""
echo "=== 4. ROMANEO ==="

# Crear romaneo (corregido - usar garron numérico)
ROMANEO_RESPONSE=$(curl -s -X POST "$BASE_URL/romaneos" \
    -H "Content-Type: application/json" \
    -d "{\"garron\":$(date +%s | tail -c 3),\"pesoMediaIzq\":120,\"pesoMediaDer\":118,\"pesoVivo\":450,\"operadorId\":\"$ADMIN_ID\"}")
ROMANEO_SUCCESS=$(echo "$ROMANEO_RESPONSE" | grep -o '"success":[^,}]*' | cut -d':' -f2)
log_result "Crear romaneo" "true" "$ROMANEO_SUCCESS" "$ROMANEO_RESPONSE"

echo ""
echo "=== 5. VB ROMANEO ==="

VB_RESPONSE=$(curl -s "$BASE_URL/vb-romaneo?tipo=pendientes")
VB_SUCCESS=$(echo "$VB_RESPONSE" | grep -o '"success":[^,}]*' | cut -d':' -f2)
log_result "VB Romaneo API" "true" "$VB_SUCCESS"

echo ""
echo "=== 6. STOCK ==="

STOCK_RESPONSE=$(curl -s "$BASE_URL/stock")
STOCK_SUCCESS=$(echo "$STOCK_RESPONSE" | grep -o '"success":[^,}]*' | cut -d':' -f2)
log_result "Stock API" "true" "$STOCK_SUCCESS"

echo ""
echo "=== 7. SUBPRODUCTOS ==="

# Crear menudencia (con tipoMenudenciaNombre)
MENUD_RESPONSE=$(curl -s -X POST "$BASE_URL/menudencias" \
    -H "Content-Type: application/json" \
    -d '{"tipoMenudenciaNombre":"Hígado","pesoIngreso":25}')
MENUD_SUCCESS=$(echo "$MENUD_RESPONSE" | grep -o '"success":[^,}]*' | cut -d':' -f2)
log_result "Crear menudencia" "true" "$MENUD_SUCCESS" "$MENUD_RESPONSE"

# Crear cuero (con pesoKg correcto)
CUERO_RESPONSE=$(curl -s -X POST "$BASE_URL/cueros" \
    -H "Content-Type: application/json" \
    -d '{"cantidad":1,"pesoKg":35,"conservacion":"SALADO"}')
CUERO_SUCCESS=$(echo "$CUERO_RESPONSE" | grep -o '"success":[^,}]*' | cut -d':' -f2)
log_result "Crear cuero" "true" "$CUERO_SUCCESS" "$CUERO_RESPONSE"

# Crear rendering (con pesoKg correcto)
REND_RESPONSE=$(curl -s -X POST "$BASE_URL/rendering" \
    -H "Content-Type: application/json" \
    -d '{"tipo":"GRASA","pesoKg":100}')
REND_SUCCESS=$(echo "$REND_RESPONSE" | grep -o '"success":[^,}]*' | cut -d':' -f2)
log_result "Crear rendering" "true" "$REND_SUCCESS" "$REND_RESPONSE"

echo ""
echo "=== 8. DESPOSTADA ==="

# Crear lote despostada
LOTE_RESPONSE=$(curl -s -X POST "$BASE_URL/lotes-despostada" \
    -H "Content-Type: application/json" \
    -d "{\"operadorId\":\"$ADMIN_ID\"}")
LOTE_SUCCESS=$(echo "$LOTE_RESPONSE" | grep -o '"success":[^,}]*' | cut -d':' -f2)
LOTE_ID=$(echo "$LOTE_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
log_result "Crear lote despostada" "true" "$LOTE_SUCCESS"

# Crear movimiento despostada
if [ -n "$LOTE_ID" ]; then
    MOV_RESPONSE=$(curl -s -X POST "$BASE_URL/movimientos-despostada" \
        -H "Content-Type: application/json" \
        -d "{\"loteId\":\"$LOTE_ID\",\"tipo\":\"CORTE\",\"productoNombre\":\"Bola de lomo\",\"pesoBruto\":50,\"pesoNeto\":45,\"operadorId\":\"$ADMIN_ID\"}")
    MOV_SUCCESS=$(echo "$MOV_RESPONSE" | grep -o '"success":[^,}]*' | cut -d':' -f2)
    log_result "Crear movimiento despostada" "true" "$MOV_SUCCESS"
fi

echo ""
echo "=== 9. VALIDACIONES ==="

# Probar validación CUIT único
CUIT_DUP_RESPONSE=$(curl -s -X POST "$BASE_URL/clientes" \
    -H "Content-Type: application/json" \
    -d '{"nombre":"Duplicado","cuit":"20-12345678-9"}')
CUIT_DUP_SUCCESS=$(echo "$CUIT_DUP_RESPONSE" | grep -o '"success":[^,}]*' | cut -d':' -f2)
if [ "$CUIT_DUP_SUCCESS" = "false" ]; then
    echo "✅ Validación CUIT único funciona correctamente"
    SUCCESSES=$((SUCCESSES + 1))
else
    echo "❌ Validación CUIT único falló"
    ERRORS=$((ERRORS + 1))
fi

# Login inválido
BAD_LOGIN=$(curl -s -X POST "$BASE_URL/auth" \
    -H "Content-Type: application/json" \
    -d '{"usuario":"admin","password":"wrong"}')
BAD_SUCCESS=$(echo "$BAD_LOGIN" | grep -o '"success":[^,}]*' | cut -d':' -f2)
if [ "$BAD_SUCCESS" = "false" ]; then
    echo "✅ Login inválido rechazado correctamente"
    SUCCESSES=$((SUCCESSES + 1))
else
    echo "❌ Login inválido debería ser rechazado"
    ERRORS=$((ERRORS + 1))
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
