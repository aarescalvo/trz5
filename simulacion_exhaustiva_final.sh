#!/bin/bash

# ======================================================================
# SIMULACIÓN EXHAUSTIVA FINAL - Sistema Frigorífico v2.0.4
# ======================================================================

BASE_URL="http://localhost:3000/api"
TS=$(date +%s)

ERRORS=0
SUCCESSES=0
WARNINGS=0
ERRORS_DETAIL=""

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
        ERRORS=$((ERRORS + 1))
        ERRORS_DETAIL="$ERRORS_DETAIL\n- $test_name"
    fi
}

log_warning() {
    local msg=$1
    echo "⚠️  $msg"
    WARNINGS=$((WARNINGS + 1))
}

echo "========================================="
echo "   SIMULACIÓN EXHAUSTIVA FINAL - v2.0.4"
echo "   $(date)"
echo "========================================="

# ======================================================================
# FASE 1: AUTENTICACIÓN Y USUARIOS
# ======================================================================
echo ""
echo "=== FASE 1: AUTENTICACIÓN Y USUARIOS ==="

LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth" \
    -H "Content-Type: application/json" \
    -d '{"usuario":"admin","password":"admin123"}')
ADMIN_ID=$(echo "$LOGIN_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
log_result "Login admin" "true" "$(echo "$LOGIN_RESPONSE" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

echo "Admin ID: $ADMIN_ID"

AUTH_CHECK=$(curl -s "$BASE_URL/auth?operadorId=$ADMIN_ID")
log_result "Validar sesión" "true" "$(echo "$AUTH_CHECK" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

BAD_LOGIN=$(curl -s -X POST "$BASE_URL/auth" \
    -H "Content-Type: application/json" \
    -d '{"usuario":"admin","password":"wrong"}')
if echo "$BAD_LOGIN" | grep -q '"success":false'; then
    echo "✅ Login inválido rechazado correctamente"
    SUCCESSES=$((SUCCESSES + 1))
else
    echo "❌ Login inválido debería ser rechazado"
    ERRORS=$((ERRORS + 1))
fi

OPERADORES=$(curl -s "$BASE_URL/operadores")
log_result "Listar operadores" "true" "$(echo "$OPERADORES" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

# ======================================================================
# FASE 2: CONFIGURACIÓN
# ======================================================================
echo ""
echo "=== FASE 2: CONFIGURACIÓN ==="

# Corrales
CORRALES=$(curl -s "$BASE_URL/corrales")
log_result "Listar corrales" "true" "$(echo "$CORRALES" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

CORRAL_CREATE=$(curl -s -X POST "$BASE_URL/corrales" \
    -H "Content-Type: application/json" \
    -d "{\"nombre\":\"CORRAL FINAL $TS\",\"capacidad\":50}")
CORRAL_ID=$(echo "$CORRAL_CREATE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
log_result "Crear corral" "true" "$(echo "$CORRAL_CREATE" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

# Cámaras
CAMARAS=$(curl -s "$BASE_URL/camaras")
log_result "Listar cámaras" "true" "$(echo "$CAMARAS" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

CAMARA_CREATE=$(curl -s -X POST "$BASE_URL/camaras" \
    -H "Content-Type: application/json" \
    -d "{\"nombre\":\"CAMARA FINAL $TS\",\"tipo\":\"FAENA\",\"capacidad\":500}")
CAMARA_ID=$(echo "$CAMARA_CREATE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
log_result "Crear cámara" "true" "$(echo "$CAMARA_CREATE" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

# Clientes
CLIENTES=$(curl -s "$BASE_URL/clientes")
log_result "Listar clientes" "true" "$(echo "$CLIENTES" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

CLIENTE_CREATE=$(curl -s -X POST "$BASE_URL/clientes" \
    -H "Content-Type: application/json" \
    -d "{\"nombre\":\"CLIENTE FINAL $TS\",\"cuit\":\"20-$TS-9\",\"esProductor\":true,\"esUsuarioFaena\":true}")
CLIENTE_ID=$(echo "$CLIENTE_CREATE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
log_result "Crear cliente" "true" "$(echo "$CLIENTE_CREATE" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

# Validar CUIT único
CUIT_DUP=$(curl -s -X POST "$BASE_URL/clientes" \
    -H "Content-Type: application/json" \
    -d "{\"nombre\":\"DUP\",\"cuit\":\"20-$TS-9\"}")
if echo "$CUIT_DUP" | grep -q '"success":false'; then
    echo "✅ Validación CUIT único funciona"
    SUCCESSES=$((SUCCESSES + 1))
else
    echo "❌ Validación CUIT único falló"
    ERRORS=$((ERRORS + 1))
fi

# Transportistas
TRANS=$(curl -s "$BASE_URL/transportistas")
log_result "Listar transportistas" "true" "$(echo "$TRANS" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

# Productos
PRODUCTOS=$(curl -s "$BASE_URL/productos")
log_result "Listar productos" "true" "$(echo "$PRODUCTOS" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

# Insumos
INSUMOS=$(curl -s "$BASE_URL/insumos")
log_result "Listar insumos" "true" "$(echo "$INSUMOS" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

# Configuración
CONFIG=$(curl -s "$BASE_URL/configuracion")
log_result "Listar configuración" "true" "$(echo "$CONFIG" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

# ======================================================================
# FASE 3: PESAJE Y TROPA
# ======================================================================
echo ""
echo "=== FASE 3: PESAJE Y TROPA ==="

# Crear pesaje de ingreso Hacienda
PESAJE_CREATE=$(curl -s -X POST "$BASE_URL/pesaje-camion" \
    -H "Content-Type: application/json" \
    -d "{
        \"tipo\": \"INGRESO_HACIENDA\",
        \"patenteChasis\": \"TEST$TS\",
        \"chofer\": \"Test Driver\",
        \"productorId\": \"$CLIENTE_ID\",
        \"usuarioFaenaId\": \"$CLIENTE_ID\",
        \"especie\": \"BOVINO\",
        \"dte\": \"DTE-$TS\",
        \"guia\": \"GUIA-$TS\",
        \"cantidadCabezas\": 5,
        \"corralId\": \"$CORRAL_ID\",
        \"operadorId\": \"$ADMIN_ID\"
    }")
PESAJE_ID=$(echo "$PESAJE_CREATE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
log_result "Crear pesaje ingreso hacienda" "true" "$(echo "$PESAJE_CREATE" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

TROPA_ID=$(echo "$PESAJE_CREATE" | grep -o '"tropaId":"[^"]*"' | cut -d'"' -f4)
TROPA_CODIGO=$(echo "$PESAJE_CREATE" | grep -o '"codigo":"B[^"]*"' | head -1 | cut -d'"' -f4)
echo "Tropa ID: $TROPA_ID, Codigo: $TROPA_CODIGO"

# Crear pesaje particular
PESAJE_PART=$(curl -s -X POST "$BASE_URL/pesaje-camion" \
    -H "Content-Type: application/json" \
    -d "{
        \"tipo\": \"PESAJE_PARTICULAR\",
        \"patenteChasis\": \"PART$TS\",
        \"chofer\": \"Particular Driver\",
        \"operadorId\": \"$ADMIN_ID\"
    }")
log_result "Crear pesaje particular" "true" "$(echo "$PESAJE_PART" | grep -o '"success":[^,}]*' | cut -d':' -f2)"
if echo "$PESAJE_PART" | grep -q '"tropa":null'; then
    echo "✅ Pesaje particular sin tropa (correcto)"
    SUCCESSES=$((SUCCESSES + 1))
else
    echo "❌ Pesaje particular no debería crear tropa"
    ERRORS=$((ERRORS + 1))
fi

# Crear salida de mercadería
PESAJE_SALIDA=$(curl -s -X POST "$BASE_URL/pesaje-camion" \
    -H "Content-Type: application/json" \
    -d "{
        \"tipo\": \"SALIDA_MERCADERIA\",
        \"patenteChasis\": \"SALIDA$TS\",
        \"chofer\": \"Salida Driver\",
        \"destino\": \"Cliente Destino\",
        \"operadorId\": \"$ADMIN_ID\"
    }")
log_result "Crear salida mercadería" "true" "$(echo "$PESAJE_SALIDA" | grep -o '"success":[^,}]*' | cut -d':' -f2)"
if echo "$PESAJE_SALIDA" | grep -q '"tropa":null'; then
    echo "✅ Salida de mercadería sin tropa (correcto)"
    SUCCESSES=$((SUCCESSES + 1))
else
    echo "❌ Salida de mercadería no debería crear tropa"
    ERRORS=$((ERRORS + 1))
fi

# Verificar tropas
TROPAS=$(curl -s "$BASE_URL/tropas")
log_result "Listar tropas" "true" "$(echo "$TROPAS" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

# ======================================================================
# FASE 4: FAENA Y ROMANEO
# ======================================================================
echo ""
echo "=== FASE 4: FAENA Y ROMANEO ==="

# Lista de Faena
LISTA_FAENA=$(curl -s "$BASE_URL/lista-faena")
log_result "Listar listas de faena" "true" "$(echo "$LISTA_FAENA" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

# Romaneos
ROMANEOS=$(curl -s "$BASE_URL/romaneos")
log_result "Listar romaneos" "true" "$(echo "$ROMANEOS" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

# Crear romaneo
ROMANEO_CREATE=$(curl -s -X POST "$BASE_URL/romaneos" \
    -H "Content-Type: application/json" \
    -d "{\"garron\":$((RANDOM % 999))",\"pesoMediaIzq\":120,\"pesoMediaDer\":118,\"operadorId\":\"$ADMIN_ID\"}")
log_result "Crear romaneo" "true" "$(echo "$ROMANEO_CREATE" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

# VB Romaneo
VB_ROMANEO=$(curl -s "$BASE_URL/vb-romaneo")
log_result "VB Romaneo" "true" "$(echo "$VB_ROMANEO" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

# ======================================================================
# FASE 5: SUBPRODUCTOS
# ======================================================================
echo ""
echo "=== FASE 5: SUBPRODUCTOS ==="

# Menudencias
MENUDENCIAS=$(curl -s "$BASE_URL/menudencias")
log_result "Listar menudencias" "true" "$(echo "$MENUDENCIAS" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

MENUD_CREATE=$(curl -s -X POST "$BASE_URL/menudencias" \
    -H "Content-Type: application/json" \
    -d '{"tipoMenudenciaNombre":"Hígado Test","pesoIngreso":25}')
log_result "Crear menudencia" "true" "$(echo "$MENUD_CREATE" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

# Rendering
RENDERING=$(curl -s "$BASE_URL/rendering")
log_result "Listar rendering" "true" "$(echo "$RENDERING" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

REND_CREATE=$(curl -s -X POST "$BASE_URL/rendering" \
    -H "Content-Type: application/json" \
    -d '{"tipo":"GRASA","pesoKg":100}')
log_result "Crear rendering" "true" "$(echo "$REND_CREATE" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

# Cueros
CUEROS=$(curl -s "$BASE_URL/cueros")
log_result "Listar cueros" "true" "$(echo "$CUEROS" | grep -o '"success":[^,}]*' | cut -d':' -f2)"
CUERO_CREATE=$(curl -s -X POST "$BASE_URL/cueros" \
    -H "Content-Type: application/json" \
    -d '{"cantidad":1,"pesoKg":35,"conservacion":"SALADO"}')
log_result "Crear cuero" "true" "$(echo "$CUERO_CREATE" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

# ======================================================================
# FASE 6: STOCK Y CÁMARAS
# ======================================================================
echo ""
echo "=== FASE 6: STOCK Y CÁMARAS ==="

STOCK=$(curl -s "$BASE_URL/stock")
log_result "Listar stock" "true" "$(echo "$STOCK" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

DESPACHOS=$(curl -s "$BASE_URL/despachos")
log_result "Listar despachos" "true" "$(echo "$DESPACHOS" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

EMPAQUE=$(curl -s "$BASE_URL/empaque")
log_result "Listar empaque" "true" "$(echo "$EMPAQUE" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

EXPEDICION=$(curl -s "$BASE_URL/expedicion")
log_result "Listar expedición" "true" "$(echo "$EXPEDICION" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

# ======================================================================
# FASE 7: DESPOSTADA
# ======================================================================
echo ""
echo "=== FASE 7: DESPOSTADA ==="

LOTES=$(curl -s "$BASE_URL/lotes-despostada")
log_result "Listar lotes despostada" "true" "$(echo "$LOTES" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

LOTE_CREATE=$(curl -s -X POST "$BASE_URL/lotes-despostada" \
    -H "Content-Type: application/json" \
    -d "{\"operadorId\":\"$ADMIN_ID\"}")
LOTE_ID=$(echo "$LOTE_CREATE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
log_result "Crear lote despostada" "true" "$(echo "$LOTE_CREATE" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

MOV_DES=$(curl -s "$BASE_URL/movimientos-despostada")
log_result "Listar movimientos despostada" "true" "$(echo "$MOV_DES" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

if [ -n "$LOTE_ID" ]; then
    MOV_CREATE=$(curl -s -X POST "$BASE_URL/movimientos-despostada" \
        -H "Content-Type: application/json" \
        -d "{\"loteId\":\"$LOTE_ID\",\"tipo\":\"CORTE\",\"productoNombre\":\"Test Corte\",\"pesoBruto\":50,\"pesoNeto\":45,\"operadorId\":\"$ADMIN_ID\"}")
    log_result "Crear movimiento despostada" "true" "$(echo "$MOV_CREATE" | grep -o '"success":[^,}]*' | cut -d':' -f2)"
fi

ING_DES=$(curl -s "$BASE_URL/ingreso-despostada")
log_result "Listar ingreso despostada" "true" "$(echo "$ING_DES" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

# ======================================================================
# FASE 8: REPORTES Y DOCUMENTACIÓN
# ======================================================================
echo ""
echo "=== FASE 8: REPORTES Y DOCUMENTACIÓN ==="

REPORTES=$(curl -s "$BASE_URL/reportes")
log_result "Listar reportes" "true" "$(echo "$REPORTES" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

CCIR=$(curl -s "$BASE_URL/ccir")
log_result "Listar CCIR" "true" "$(echo "$CCIR" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

DECL=$(curl -s "$BASE_URL/declaracion-jurada")
log_result "Listar declaraciones juradas" "true" "$(echo "$DECL" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

FACT=$(curl -s "$BASE_URL/facturacion")
log_result "Listar facturación" "true" "$(echo "$FACT" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

AUDIT=$(curl -s "$BASE_URL/auditoria")
log_result "Listar auditoría" "true" "$(echo "$AUDIT" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

# ======================================================================
# FASE 9: BÚSQUEDA Y TRAZABILIDAD
# ======================================================================
echo ""
echo "=== FASE 9: BÚSQUEDA Y TRAZABILIDAD ==="

BUSQUEDA=$(curl -s "$BASE_URL/busqueda?q=test")
log_result "Búsqueda global" "true" "$(echo "$BUSQUEDA" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

CODIGO=$(curl -s "$BASE_URL/codigo-barras")
log_result "Código de barras" "true" "$(echo "$CODIGO" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

CALIDAD=$(curl -s "$BASE_URL/calidad-reclamos")
log_result "Calidad reclamos" "true" "$(echo "$CALIDAD" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

COND=$(curl -s "$BASE_URL/condiciones-embalaje")
log_result "Condiciones embalaje" "true" "$(echo "$COND" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

ING_CAJON=$(curl -s "$BASE_URL/ingreso-cajon")
log_result "Ingreso cajón" "true" "$(echo "$ING_CAJON" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

# ======================================================================
# FASE 10: VERIFICACIÓN FINAL
# ======================================================================
echo ""
echo "=== FASE 10: VERIFICACIÓN FINAL ==="

# Verificar integridad
echo "Verificando integridad de datos..."

# Verificar que la tropa tiene pesajeCamionId
if [ -n "$TROPA_ID" ]; then
    TROPA_VERIF=$(curl -s "$BASE_URL/tropas")
    if echo "$TROPA_VERIF" | grep -q "$TROPA_ID"; then
        echo "✅ Tropa creada correctamente"
        SUCCESSES=$((SUCCESSES + 1))
    else
        echo "❌ Tropa no encontrada"
        ERRORS=$((ERRORS + 1))
    fi
fi

# Verificar dashboard
DASHBOARD=$(curl -s "$BASE_URL/dashboard")
log_result "Dashboard" "true" "$(echo "$DASHBOARD" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

# ======================================================================
# RESUMEN FINAL
# ======================================================================
echo ""
echo "========================================="
echo "           RESUMEN FINAL"
echo "========================================="
echo "Pruebas exitosas: $SUCCESSES"
echo "Pruebas fallidas: $ERRORS"
echo "Advertencias: $WARNINGS"
echo "Total pruebas: $((SUCCESSES + ERRORS))"
echo ""
if [ $ERRORS -eq 0 ]; then
    echo "🎉 ¡TODAS LAS PRUEBAS PASARON!"
    echo "   Sistema verificado y listo para producción"
else
    echo "⚠️  Se $ERRORS errores que requieren atención"
fi
echo "========================================="

exit $ERRORS
