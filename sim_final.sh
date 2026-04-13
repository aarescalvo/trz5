#!/bin/bash
BASE_URL="http://localhost:3000/api"
TS=$(date +%s)
ERRORS=0
SUCCESSES=0
ERRORS_DETAIL=""

log_result() {
    local test_name=$1
    local expected=$2
    local actual=$3
    
    if [ "$actual" = "$expected" ]; then
        echo "✅ $test_name"
        SUCCESSES=$((SUCCESSES + 1))
    else
        echo "❌ $test_name: Esperado $expected, Obtenido $actual"
        ERRORS=$((ERRORS + 1))
        ERRORS_DETAIL="$ERRORS_DETAIL\n- $test_name"
    fi
}

echo "========================================="
echo "   SIMULACIÓN FINAL v2.0.4"
echo "   $(date)"
echo "========================================="

# FASE 1: Login
echo "=== FASE 1: AUTENTICACIÓN ==="
LOGIN=$(curl -s -X POST "$BASE_URL/auth" -H "Content-Type: application/json" -d '{"usuario":"admin","password":"admin123"}')
ADMIN_ID=$(echo "$LOGIN" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
log_result "Login admin" "true" "$(echo "$LOGIN" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

AUTH=$(curl -s "$BASE_URL/auth?operadorId=$ADMIN_ID")
log_result "Validar sesión" "true" "$(echo "$AUTH" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

BAD=$(curl -s -X POST "$BASE_URL/auth" -H "Content-Type: application/json" -d '{"usuario":"admin","password":"wrong"}')
if echo "$BAD" | grep -q '"success":false'; then echo "✅ Login inválido rechazado"; SUCCESSES=$((SUCCESSES + 1)); else echo "❌ Login inválido debería fallar"; ERRORS=$((ERRORS + 1)); fi

OP=$(curl -s "$BASE_URL/operadores")
log_result "Listar operadores" "true" "$(echo "$OP" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

# FASE 2: Config
echo "=== FASE 2: CONFIGURACIÓN ==="
CORRALES=$(curl -s "$BASE_URL/corrales")
log_result "Listar corrales" "true" "$(echo "$CORRALES" | grep -o '"success":[^,}]*' | cut -d':' -f2)"
CORRAL_CREATE=$(curl -s -X POST "$BASE_URL/corrales" -H "Content-Type: application/json" -d "{\"nombre\":\"CORRAL TEST $TS\",\"capacidad\":50}")
CORRAL_ID=$(echo "$CORRAL_CREATE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
log_result "Crear corral" "true" "$(echo "$CORRAL_CREATE" | grep -o '"success":[^,}]*' | cut -d':' -f2)"
CAMARAS=$(curl -s "$BASE_URL/camaras")
log_result "Listar cámaras" "true" "$(echo "$CAMARAS" | grep -o '"success":[^,}]*' | cut -d':' -f2)"
CAMARA_CREATE=$(curl -s -X POST "$BASE_URL/camaras" -H "Content-Type: application/json" -d "{\"nombre\":\"CAMARA TEST $TS\",\"tipo\":\"FAENA\",\"capacidad\":500}")
CAMARA_ID=$(echo "$CAMARA_CREATE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
log_result "Crear cámara" "true" "$(echo "$CAMARA_CREATE" | grep -o '"success":[^,}]*' | cut -d':' -f2)"
CLIENTES=$(curl -s "$BASE_URL/clientes")
log_result "Listar clientes" "true" "$(echo "$CLIENTES" | grep -o '"success":[^,}]*' | cut -d':' -f2)"
TS2=$(date +%s)
CLIENTE_CREATE=$(curl -s -X POST "$BASE_URL/clientes" -H "Content-Type: application/json" -d "{\"nombre\":\"CLIENTE TEST $TS2\",\"cuit\":\"27-$TS2-5\",\"esProductor\":true,\"esUsuarioFaena\":true}")
CLIENTE_ID=$(echo "$CLIENTE_CREATE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
log_result "Crear cliente" "true" "$(echo "$CLIENTE_CREATE" | grep -o '"success":[^,}]*' | cut -d':' -f2)"
CUIT_DUP=$(curl -s -X POST "$BASE_URL/clientes" -H "Content-Type: application/json" -d "{\"nombre\":\"DUP\",\"cuit\":\"27-$TS2-5\"}")
if echo "$CUIT_DUP" | grep -q '"success":false'; then echo "✅ CUIT único validado"; SUCCESSES=$((SUCCESSES + 1)); else echo "❌ CUIT único no validado"; ERRORS=$((ERRORS + 1)); fi
TRANS=$(curl -s "$BASE_URL/transportistas")
log_result "Listar transportistas" "true" "$(echo "$TRANS" | grep -o '"success":[^,}]*' | cut -d':' -f2)"
PROD=$(curl -s "$BASE_URL/productos")
log_result "Listar productos" "true" "$(echo "$PROD" | grep -o '"success":[^,}]*' | cut -d':' -f2)"
INS=$(curl -s "$BASE_URL/insumos")
log_result "Listar insumos" "true" "$(echo "$INS" | grep -o '"success":[^,}]*' | cut -d':' -f2)"
CONF=$(curl -s "$BASE_URL/configuracion")
log_result "Listar configuración" "true" "$(echo "$CONF" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

# FASE 3: Pesajes
echo "=== FASE 3: PESAJE Y TROPA ==="
PESAJE=$(curl -s -X POST "$BASE_URL/pesaje-camion" -H "Content-Type: application/json" \
  -d "{\"tipo\":\"INGRESO_HACIENDA\",\"patenteChasis\":\"TEST$TS\",\"chofer\":\"Test\",\"productorId\":\"$CLIENTE_ID\",\"usuarioFaenaId\":\"$CLIENTE_ID\",\"especie\":\"BOVINO\",\"dte\":\"DTE-$TS\",\"guia\":\"GUIA-$TS\",\"cantidadCabezas\":5,\"corralId\":\"$CORRAL_ID\",\"operadorId\":\"$ADMIN_ID\"}")
log_result "Crear pesaje con "true" "$(echo "$PESAJE" | grep -o '"success":[^,}]*' | cut -d':' -f2)"
TROPA_ID=$(echo "$PESAJE" | grep -o '"tropaId":"[^"]*"' | cut -d'"' -f4)
if [ -n "$TROPA_ID" ]; then
    echo "✅ Tropa creada con pesaje: $TROPA_ID"
    SUCCESSES=$((SUCCESSES + 1))
else
    echo "⚠️  No se detectó tropaId en respuesta"
    WARNINGS=$((WARNINGS + 1))
fi
TROPAS=$(curl -s "$BASE_URL/tropas")
log_result "Listar tropas" "true" "$(echo "$TROPAS" | grep -o '"success":[^,}]*' | cut -d':' -f2)"
# FASE 4: Faena
echo "=== FASE 4: FAENA Y ROMANEO ==="
FAENA=$(curl -s "$BASE_URL/lista-faena")
log_result "Listar faena" "true" "$(echo "$FAENA" | grep -o '"success":[^,}]*' | cut -d':' -f2)"
GARRONES=$(curl -s "$BASE_URL/garrones-asignados")
log_result "Listar garrones" "true" "$(echo "$GARRONES" | grep -o '"success":[^,}]*' | cut -d':' -f2)"
ROMANEOS=$(curl -s "$BASE_URL/romaneos")
log_result "Listar romaneos" "true" "$(echo "$ROMANEOS" | grep -o '"success":[^,}]*' | cut -d':' -f2)"
ROMANEO=$(curl -s -X POST "$BASE_URL/romaneos" -H "Content-Type: application/json" \
  -d "{\"garron\":$((RANDOM % 999)),\"pesoMediaIzq\":120,\"pesoMediaDer\":118,\"operadorId\":\"$ADMIN_ID\"}")
log_result "Crear romaneo" "true" "$(echo "$ROMANEO" | grep -o '"success":[^,}]*' | cut -d':' -f2)"
VB=$(curl -s "$BASE_URL/vb-romaneo")
log_result "VB Romaneo" "true" "$(echo "$VB" | grep -o '"success":[^,}]*' | cut -d':' -f2)"
# FASE 5: Subproductos
echo "=== FASE 5: SUBPRODUCTOS ==="
MEN=$(curl -s "$BASE_URL/menudencias")
log_result "Listar menudencias" "true" "$(echo "$MEN" | grep -o '"success":[^,}]*' | cut -d':' -f2)"
MEN_C=$(curl -s -X POST "$BASE_URL/menudencias" -H "Content-Type: application/json" -d '{"tipoMenudenciaNombre":"Test","pesoIngreso":25}')
log_result "Crear menudencia" "true" "$(echo "$MEN_C" | grep -o '"success":[^,}]*' | cut -d':' -f2)"
REND=$(curl -s "$BASE_URL/rendering")
log_result "Listar rendering" "true" "$(echo "$REND" | grep -o '"success":[^,}]*' | cut -d':' -f2)"
REND_C=$(curl -s -X POST "$BASE_URL/rendering" -H "Content-Type: application/json" -d '{"tipo":"GRASA","pesoKg":100}')
log_result "Crear rendering" "true" "$(echo "$REND_C" | grep -o '"success":[^,}]*' | cut -d':' -f2)"
CUEROS=$(curl -s "$BASE_URL/cueros")
log_result "Listar cueros" "true" "$(echo "$CUEROS" | grep -o '"success":[^,}]*' | cut -d':' -f2)"
CUERO_C=$(curl -s -X POST "$BASE_URL/cueros" -H "Content-Type: application/json" -d '{"cantidad":1,"pesoKg":35}')
log_result "Crear cuero" "true" "$(echo "$CUERO_C" | grep -o '"success":[^,}]*' | cut -d':' -f2)"
# FASE 6: Stock
echo "=== FASE 6: STOCK Y CÁMARAS ==="
STOCK=$(curl -s "$BASE_URL/stock")
log_result "Listar stock" "true" "$(echo "$STOCK" | grep -o '"success":[^,}]*' | cut -d':' -f2)"
DESP=$(curl -s "$BASE_URL/despachos")
log_result "Listar despachos" "true" "$(echo "$DESP" | grep -o '"success":[^,}]*' | cut -d':' -f2)"
EMP=$(curl -s "$BASE_URL/empaque")
log_result "Listar empaque" "true" "$(echo "$EMP" | grep -o '"success":[^,}]*' | cut -d':' -f2)"
EXP=$(curl -s "$BASE_URL/expedicion")
log_result "Listar expedición" "true" "$(echo "$EXP" | grep -o '"success":[^,}]*' | cut -d':' -f2)"
# FASE 7: Despostada
echo "=== FASE 7: DESPOSTADA ==="
LOTES=$(curl -s "$BASE_URL/lotes-despostada")
log_result "Listar lotes" "true" "$(echo "$LOTES" | grep -o '"success":[^,}]*' | cut -d':' -f2)"
LOTE=$(curl -s -X POST "$BASE_URL/lotes-despostada" -H "Content-Type: application/json" -d "{\"operadorId\":\"$ADMIN_ID\"}")
LOTE_ID=$(echo "$LOTE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
log_result "Crear lote" "true" "$(echo "$LOTE" | grep -o '"success":[^,}]*' | cut -d':' -f2)"
MOV=$(curl -s "$BASE_URL/movimientos-despostada")
log_result "Listar movimientos" "true" "$(echo "$MOV" | grep -o '"success":[^,}]*' | cut -d':' -f2)"
if [ -n "$LOTE_ID" ]; then
MOV_C=$(curl -s -X POST "$BASE_URL/movimientos-despostada" -H "Content-Type: application/json" \
  -d "{\"loteId\":\"$LOTE_ID\",\"tipo\":\"CORTE\",\"productoNombre\":\"Test\",\"pesoBruto\":50,\"pesoNeto\":45,\"operadorId\":\"$ADMIN_ID\"}")
log_result "Crear movimiento" "true" "$(echo "$MOV_C" | grep -o '"success":[^,}]*' | cut -d':' -f2)"
fi
ING=$(curl -s "$BASE_URL/ingreso-despostada")
log_result "Listar ingreso despostada" "true" "$(echo "$ING" | grep -o '"success":[^,}]*' | cut -d':' -f2)"
# FASE 8: Reportes
echo "=== FASE 8: REPORTES ==="
REP=$(curl -s "$BASE_URL/reportes")
log_result "Listar reportes" "true" "$(echo "$REP" | grep -o '"success":[^,}]*' | cut -d':' -f2)"
CCIR=$(curl -s "$BASE_URL/ccir")
log_result "Listar CCIR" "true" "$(echo "$CCIR" | grep -o '"success":[^,}]*' | cut -d':' -f2)"
DECL=$(curl -s "$BASE_URL/declaracion-jurada")
log_result "Listar declaraciones" "true" "$(echo "$DECL" | grep -o '"success":[^,}]*' | cut -d':' -f2)"
FACT=$(curl -s "$BASE_URL/facturacion")
log_result "Listar facturación" "true" "$(echo "$FACT" | grep -o '"success":[^,}]*' | cut -d':' -f2)"
AUD=$(curl -s "$BASE_URL/auditoria")
log_result "Listar auditoría" "true" "$(echo "$AUD" | grep -o '"success":[^,}]*' | cut -d':' -f2)"
# FASE 9: Búsqueda
echo "=== FASE 9: BÚSQUEDA ==="
BUS=$(curl -s "$BASE_URL/busqueda?q=test")
log_result "Búsqueda global" "true" "$(echo "$BUS" | grep -o '"success":[^,}]*' | cut -d':' -f2)"
COD=$(curl -s "$BASE_URL/codigo-barras")
log_result "Código de barras" "true" "$(echo "$COD" | grep -o '"success":[^,}]*' | cut -d':' -f2)"
CAL=$(curl -s "$BASE_URL/calidad-reclamos")
log_result "Calidad" "true" "$(echo "$CAL" | grep -o '"success":[^,}]*' | cut -d':' -f2)"
COND=$(curl -s "$BASE_URL/condiciones-embalaje")
log_result "Condiciones" "true" "$(echo "$COND" | grep -o '"success":[^,}]*' | cut -d':' -f2)"
CAJ=$(curl -s "$BASE_URL/ingreso-cajon")
log_result "Ingreso cajón" "true" "$(echo "$CAJ" | grep -o '"success":[^,}]*' | cut -d':' -f2)"
# FASE 10: Dashboard
echo "=== FASE 10: DASHBOARD ==="
DASH=$(curl -s "$BASE_URL/dashboard")
log_result "Dashboard" "true" "$(echo "$DASH" | grep -o '"success":[^,}]*' | cut -d':' -f2)"
# RESUMEN
echo ""
echo "========================================="
echo "           RESUMEN FINAL"
echo "========================================="
echo "Pruebas exitosas: $SUCCESSES"
echo "Pruebas fallidas: $ERRORS"
echo "Advertencias: $WARNINGS"
echo "Total pruebas: $((SUCCESSES + ERRORS))"
if [ $ERRORS -eq 0 ]; then
    echo "🎉 ¡TODAS LAS PRUEBAS PASARON!"
    echo "   Sistema verificado y listo para producción"
else
    echo "⚠️  Se $ERRORS errores que requieren atención"
fi
echo "========================================="

exit $ERRORS
