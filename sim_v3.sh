#!/bin/bash
BASE_URL="http://localhost:3000/api"
E=0
S=0
W=0
test_api() {
    local name=$1
    local url=$2
    local expected=${3:-200}
    local res=$(curl -s "$url")
    local success=$(echo "$res" | grep -o '"success":[^,}]*' | cut -d':' -f2)
    if [ "$success" = "$expected" ]; then
        echo "✅ $name"
        S=$((S + 1))
    else
        echo "❌ $name: got $success"
        E=$((E + 1))
    fi
}
echo "========================================"
echo "   SIMULACIÓN FINAL v2.0.4"
echo "   $(date)"
echo "========================================"
echo ""
echo "=== TESTING LOGIN ==="
LOGIN=$(curl -s -X POST "$BASE_URL/auth" -H "Content-Type: application/json" -d '{"usuario":"admin","password":"admin123"}')
ADMIN_ID=$(echo "$LOGIN" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -n "$ADMIN_ID" ]; then echo "✅ Login admin: $ADMIN_ID"; S=$((S + 1)); else echo "❌ Login failed"; E=$((E + 1)); fi
echo ""
echo "=== TESTING ALL ENDPOINTS ==="
test_api "Dashboard" "$BASE_URL/dashboard" true
test_api "Tropas" "$BASE_URL/tropas" true
test_api "Corrales" "$BASE_URL/corrales" true
test_api "Camaras" "$BASE_URL/camaras" true
test_api "Clientes" "$BASE_URL/clientes" true
test_api "Operadores" "$BASE_URL/operadores" true
test_api "Transportistas" "$BASE_URL/transportistas" true
test_api "Productos" "$BASE_URL/productos" true
test_api "Insumos" "$BASE_URL/insumos" true
test_api "Configuración" "$BASE_URL/configuracion" true
test_api "Pesaje Camión" "$BASE_URL/pesaje-camion" true
test_api "Lista Faena" "$BASE_URL/lista-faena" true
test_api "Garrones" "$BASE_URL/garrones-asignados" true
test_api "Romaneos" "$BASE_URL/romaneos" true
test_api "VB Romaneo" "$BASE_URL/vb-romaneo" true
test_api "Menudencias" "$BASE_URL/menudencias" true
test_api "Rendering" "$BASE_URL/rendering" true
test_api "Cueros" "$BASE_URL/cueros" true
test_api "Stock" "$BASE_URL/stock" true
test_api "Despachos" "$BASE_URL/despachos" true
test_api "Empaque" "$BASE_URL/empaque" true
test_api "Expedición" "$BASE_URL/expedicion" true
test_api "Lotes Despostada" "$BASE_URL/lotes-despostada" true
test_api "Movimientos Despostada" "$BASE_URL/movimientos-despostada" true
test_api "Ingreso Despostada" "$BASE_URL/ingreso-despostada" true
test_api "Reportes" "$BASE_URL/reportes" true
test_api "CCIR" "$BASE_URL/ccir" true
test_api "Declaración Jurada" "$BASE_URL/declaracion-jurada" true
test_api "Facturación" "$BASE_URL/facturacion" true
test_api "Auditoría" "$BASE_URL/auditoria" true
test_api "Búsqueda" "$BASE_URL/busqueda?q=test" true
test_api "Código Barras" "$BASE_URL/codigo-barras" true
test_api "Calidad Reclamos" "$BASE_URL/calidad-reclamos" true
test_api "Condiciones Embalaje" "$BASE_URL/condiciones-embalaje" true
test_api "Ingreso Cajón" "$BASE_URL/ingreso-cajon" true
echo ""
echo "=== TESTING CRUD OPERATIONS ==="
# Crear corral
CR=$(curl -s -X POST "$BASE_URL/corrales" -H "Content-Type: application/json" -d '{"nombre":"TEST CORRAL","capacidad":50}')
CR_ID=$(echo "$CR" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -n "$CR_ID" ]; then echo "✅ Crear corral"; S=$((S + 1)); else echo "❌ Crear corral"; E=$((E + 1)); fi
# Crear cliente
CL=$(curl -s -X POST "$BASE_URL/clientes" -H "Content-Type: application/json" -d '{"nombre":"TEST CLIENTE","cuit":"27-99999999-9","esProductor":true,"esUsuarioFaena":true}')
CL_ID=$(echo "$CL" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -n "$CL_ID" ]; then echo "✅ Crear cliente"; S=$((S + 1)); else echo "❌ Crear cliente"; E=$((E + 1)); fi
# Crear tropa via pesaje
TS=$(date +%s)
if [ -n "$CL_ID" ] && [ -n "$CR_ID" ]; then
TP=$(curl -s -X POST "$BASE_URL/pesaje-camion" -H "Content-Type: application/json" \
    -d "{\"tipo\":\"INGRESO_HACIENDA\",\"patenteChasis\":\"TEST$TS\",\"chofer\":\"Test\",\"productorId\":\"$CL_ID\",\"usuarioFaenaId\":\"$CL_ID\",\"especie\":\"BOVINO\",\"dte\":\"DTE$TS\",\"guia\":\"GUIA$TS\",\"cantidadCabezas\":5,\"corralId\":\"$CR_ID\",\"operadorId\":\"$ADMIN_ID\"}")
TP_ID=$(echo "$TP" | grep -o '"tropaId":"[^"]*"' | cut -d'"' -f4)
if [ -n "$TP_ID" ]; then echo "✅ Crear tropa via pesaje: $TP_ID"; S=$((S + 1)); else echo "❌ Crear tropa via pesaje"; E=$((E + 1)); fi
fi
# Crear romaneo
RO=$(curl -s -X POST "$BASE_URL/romaneos" -H "Content-Type: application/json" -d "{\"garron\":$((RANDOM % 999)),\"pesoMediaIzq\":120,\"pesoMediaDer\":118,\"operadorId\":\"$ADMIN_ID\"}")
if echo "$RO" | grep -q '"success":true'; then echo "✅ Crear romaneo"; S=$((S + 1)); else echo "❌ Crear romaneo"; E=$((E + 1)); fi
# Crear menudencia
MN=$(curl -s -X POST "$BASE_URL/menudencias" -H "Content-Type: application/json" -d '{"tipoMenudenciaNombre":"Test","pesoIngreso":25}')
if echo "$MN" | grep -q '"success":true'; then echo "✅ Crear menudencia"; S=$((S + 1)); else echo "❌ Crear menudencia"; E=$((E + 1)); fi
# Crear rendering
RN=$(curl -s -X POST "$BASE_URL/rendering" -H "Content-Type: application/json" -d '{"tipo":"GRASA","pesoKg":100}')
if echo "$RN" | grep -q '"success":true'; then echo "✅ Crear rendering"; S=$((S + 1)); else echo "❌ Crear rendering"; E=$((E + 1)); fi
# Crear cuero
CU=$(curl -s -X POST "$BASE_URL/cueros" -H "Content-Type: application/json" -d '{"cantidad":1,"pesoKg":35}')
if echo "$CU" | grep -q '"success":true'; then echo "✅ Crear cuero"; S=$((S + 1)); else echo "❌ Crear cuero"; E=$((E + 1)); fi
# Crear lote despostada
LD=$(curl -s -X POST "$BASE_URL/lotes-despostada" -H "Content-Type: application/json" -d "{\"operadorId\":\"$ADMIN_ID\"}")
LD_ID=$(echo "$LD" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -n "$LD_ID" ]; then echo "✅ Crear lote despostada"; S=$((S + 1)); else echo "❌ Crear lote despostada"; E=$((E + 1)); fi
# Crear movimiento despostada
if [ -n "$LD_ID" ]; then
MV=$(curl -s -X POST "$BASE_URL/movimientos-despostada" -H "Content-Type: application/json" \
    -d "{\"loteId\":\"$LD_ID\",\"tipo\":\"CORTE\",\"productoNombre\":\"Test\",\"pesoBruto\":50,\"pesoNeto\":45,\"operadorId\":\"$ADMIN_ID\"}")
if echo "$MV" | grep -q '"success":true'; then echo "✅ Crear movimiento despostada"; S=$((S + 1)); else echo "❌ Crear movimiento despostada"; E=$((E + 1)); fi
fi
echo ""
echo "=== TESTING VALIDATIONS ==="
# CUIT duplicado debe fallar
DUP=$(curl -s -X POST "$BASE_URL/clientes" -H "Content-Type: application/json" -d '{"nombre":"DUP","cuit":"27-99999999-9"}')
if echo "$DUP" | grep -q '"success":false'; then echo "✅ CUIT único validado"; S=$((S + 1)); else echo "❌ CUIT único falló"; E=$((E + 1)); fi
# Login inválido debe fallar
BAD=$(curl -s -X POST "$BASE_URL/auth" -H "Content-Type: application/json" -d '{"usuario":"admin","password":"wrong"}')
if echo "$BAD" | grep -q '"success":false'; then echo "✅ Login inválido rechazado"; S=$((S + 1)); else echo "❌ Login inválido falló"; E=$((E + 1)); fi
echo ""
echo "========================================"
echo "           RESUMEN FINAL"
echo "========================================"
echo "Exitosos: $S"
echo "Fallidos: $E"
echo "Total: $((S + E))"
echo ""
if [ $E -eq 0 ]; then
    echo "🎉 ¡TODAS LAS PRUEBAS PASARON!"
else
    echo "⚠️ Hay $E errores"
fi
echo "========================================"
exit $E
