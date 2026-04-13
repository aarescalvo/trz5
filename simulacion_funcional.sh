#!/bin/bash

# SIMULACIÓN FUNCIONAL COMPLETA DEL SISTEMA FRIGORÍFICO
# Este script prueba el flujo completo de trabajo real

BASE_URL="http://localhost:3000/api"
ERRORS=0
SUCCESSES=0
LOG_FILE="/home/z/my-project/simulacion_funcional.log"

echo "=========================================" | tee $LOG_FILE
echo "   SIMULACIÓN FUNCIONAL COMPLETA" | tee -a $LOG_FILE
echo "   $(date)" | tee -a $LOG_FILE
echo "=========================================" | tee -a $LOG_FILE
echo "" | tee -a $LOG_FILE

# Función para registrar resultado
log_result() {
    local test_name=$1
    local expected=$2
    local actual=$3
    local details=$4
    
    if [ "$actual" = "$expected" ]; then
        echo "✅ $test_name: $actual" | tee -a $LOG_FILE
        SUCCESSES=$((SUCCESSES + 1))
    else
        echo "❌ $test_name: Esperado $expected, Obtenido $actual" | tee -a $LOG_FILE
        if [ -n "$details" ]; then
            echo "   Detalle: $details" | tee -a $LOG_FILE
        fi
        ERRORS=$((ERRORS + 1))
    fi
}

echo "=== 1. AUTENTICACIÓN ===" | tee -a $LOG_FILE

# Login como admin
echo "Probando login con admin/admin123..." | tee -a $LOG_FILE
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth" \
    -H "Content-Type: application/json" \
    -d '{"usuario":"admin","password":"admin123"}')

ADMIN_ID=$(echo "$LOGIN_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
HTTP_CODE=$(echo "$LOGIN_RESPONSE" | grep -o '"success":[^,}]*' | cut -d':' -f2)

if [ "$HTTP_CODE" = "true" ] && [ -n "$ADMIN_ID" ]; then
    log_result "Login admin" "true" "true" "$ADMIN_ID"
else
    log_result "Login admin" "true" "$HTTP_CODE" "$LOGIN_RESPONSE"
fi

echo "" | tee -a $LOG_FILE
echo "=== 2. CONFIGURACIÓN - CREAR DATOS BASE ===" | tee -a $LOG_FILE

# Crear un corral
echo "Creando corral de prueba..." | tee -a $LOG_FILE
CORRAL_RESPONSE=$(curl -s -X POST "$BASE_URL/corrales" \
    -H "Content-Type: application/json" \
    -d '{"nombre":"CORRAL TEST SIM","capacidad":50,"observaciones":"Corral para simulación"}')

CORRAL_SUCCESS=$(echo "$CORRAL_RESPONSE" | grep -o '"success":[^,}]*' | cut -d':' -f2)
CORRAL_ID=$(echo "$CORRAL_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
log_result "Crear corral" "true" "$CORRAL_SUCCESS" "$CORRAL_RESPONSE"

# Crear un cliente/productor
echo "Creando cliente productor..." | tee -a $LOG_FILE
CLIENTE_RESPONSE=$(curl -s -X POST "$BASE_URL/clientes" \
    -H "Content-Type: application/json" \
    -d '{"nombre":"PRODUCTOR TEST","cuit":"20-12345678-9","esProductor":true,"esUsuarioFaena":true}')

CLIENTE_SUCCESS=$(echo "$CLIENTE_RESPONSE" | grep -o '"success":[^,}]*' | cut -d':' -f2)
CLIENTE_ID=$(echo "$CLIENTE_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
log_result "Crear cliente" "true" "$CLIENTE_SUCCESS" "$CLIENTE_RESPONSE"

# Crear transportista
echo "Creando transportista..." | tee -a $LOG_FILE
TRANS_RESPONSE=$(curl -s -X POST "$BASE_URL/transportistas" \
    -H "Content-Type: application/json" \
    -d '{"nombre":"TRANSPORTISTA TEST","cuit":"30-98765432-1"}')

TRANS_SUCCESS=$(echo "$TRANS_RESPONSE" | grep -o '"success":[^,}]*' | cut -d':' -f2)
log_result "Crear transportista" "true" "$TRANS_SUCCESS" "$TRANS_RESPONSE"

echo "" | tee -a $LOG_FILE
echo "=== 3. CICLO I - PESAJE Y TROPA ===" | tee -a $LOG_FILE

# Crear pesaje de camión
echo "Creando pesaje de camión..." | tee -a $LOG_FILE
PESAJE_RESPONSE=$(curl -s -X POST "$BASE_URL/pesaje-camion" \
    -H "Content-Type: application/json" \
    -d "{\"tipo\":\"INGRESO_HACIENDA\",\"patenteChasis\":\"AB123CD\",\"choferNombre\":\"Chofer Test\",\"operadorId\":\"$ADMIN_ID\"}")

PESAJE_SUCCESS=$(echo "$PESAJE_RESPONSE" | grep -o '"success":[^,}]*' | cut -d':' -f2)
PESAJE_ID=$(echo "$PESAJE_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
log_result "Crear pesaje camión" "true" "$PESAJE_SUCCESS" "$PESAJE_RESPONSE"

# Registrar peso bruto
if [ -n "$PESAJE_ID" ]; then
    echo "Registrando peso bruto..." | tee -a $LOG_FILE
    PESO_RESPONSE=$(curl -s -X PUT "$BASE_URL/pesaje-camion" \
        -H "Content-Type: application/json" \
        -d "{\"id\":\"$PESAJE_ID\",\"pesoBruto\":15000}")
    PESO_SUCCESS=$(echo "$PESO_RESPONSE" | grep -o '"success":[^,}]*' | cut -d':' -f2)
    log_result "Registrar peso bruto" "true" "$PESO_SUCCESS" "$PESO_RESPONSE"
fi

# Crear tropa
if [ -n "$CLIENTE_ID" ] && [ -n "$CORRAL_ID" ]; then
    echo "Creando tropa..." | tee -a $LOG_FILE
    TROPA_RESPONSE=$(curl -s -X POST "$BASE_URL/tropas" \
        -H "Content-Type: application/json" \
        -d "{\"productorId\":\"$CLIENTE_ID\",\"usuarioFaenaId\":\"$CLIENTE_ID\",\"especie\":\"BOVINO\",\"dte\":\"DTE-TEST-001\",\"guia\":\"GUIA-TEST-001\",\"cantidadCabezas\":10,\"corralId\":\"$CORRAL_ID\",\"operadorId\":\"$ADMIN_ID\"}")
    
    TROPA_SUCCESS=$(echo "$TROPA_RESPONSE" | grep -o '"success":[^,}]*' | cut -d':' -f2)
    TROPA_ID=$(echo "$TROPA_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    log_result "Crear tropa" "true" "$TROPA_SUCCESS" "$TROPA_RESPONSE"
fi

echo "" | tee -a $LOG_FILE
echo "=== 4. LISTA DE FAENA ===" | tee -a $LOG_FILE

# Crear lista de faena
if [ -n "$TROPA_ID" ]; then
    echo "Creando lista de faena..." | tee -a $LOG_FILE
    FAENA_RESPONSE=$(curl -s -X POST "$BASE_URL/lista-faena" \
        -H "Content-Type: application/json" \
        -d "{\"supervisorId\":\"$ADMIN_ID\",\"tropas\":[{\"tropaId\":\"$TROPA_ID\",\"cantidad\":5}]}")
    
    FAENA_SUCCESS=$(echo "$FAENA_RESPONSE" | grep -o '"success":[^,}]*' | cut -d':' -f2)
    FAENA_ID=$(echo "$FAENA_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    log_result "Crear lista de faena" "true" "$FAENA_SUCCESS" "$FAENA_RESPONSE"
fi

echo "" | tee -a $LOG_FILE
echo "=== 5. ASIGNACIÓN DE GARRONES ===" | tee -a $LOG_FILE

# Asignar garrones
if [ -n "$FAENA_ID" ]; then
    echo "Asignando garrones..." | tee -a $LOG_FILE
    GARRON_RESPONSE=$(curl -s -X POST "$BASE_URL/garrones-asignados" \
        -H "Content-Type: application/json" \
        -d "{\"listaFaenaId\":\"$FAENA_ID\",\"garron\":1,\"animalNumero\":1,\"tipoAnimal\":\"NO\",\"pesoVivo\":450,\"operadorId\":\"$ADMIN_ID\"}")
    
    GARRON_SUCCESS=$(echo "$GARRON_RESPONSE" | grep -o '"success":[^,}]*' | cut -d':' -f2)
    log_result "Asignar garrón" "true" "$GARRON_SUCCESS" "$GARRON_RESPONSE"
fi

echo "" | tee -a $LOG_FILE
echo "=== 6. ROMANEO ===" | tee -a $LOG_FILE

# Crear romaneo
echo "Creando registro de romaneo..." | tee -a $LOG_FILE
ROMANEO_RESPONSE=$(curl -s -X POST "$BASE_URL/romaneos" \
    -H "Content-Type: application/json" \
    -d "{\"garron\":1,\"pesoMediaIzq\":120,\"pesoMediaDer\":118,\"pesoVivo\":450,\"operadorId\":\"$ADMIN_ID\"}")

ROMANEO_SUCCESS=$(echo "$ROMANEO_RESPONSE" | grep -o '"success":[^,}]*' | cut -d':' -f2)
log_result "Crear romaneo" "true" "$ROMANEO_SUCCESS" "$ROMANEO_RESPONSE"

echo "" | tee -a $LOG_FILE
echo "=== 7. VB ROMANEO ===" | tee -a $LOG_FILE

# Verificar VB Romaneo
echo "Consultando VB Romaneo..." | tee -a $LOG_FILE
VB_RESPONSE=$(curl -s "$BASE_URL/vb-romaneo")
VB_SUCCESS=$(echo "$VB_RESPONSE" | grep -o '"success":[^,}]*' | cut -d':' -f2)
log_result "Consultar VB Romaneo" "true" "$VB_SUCCESS" "$VB_RESPONSE"

echo "" | tee -a $LOG_FILE
echo "=== 8. CÁMARAS Y STOCK ===" | tee -a $LOG_FILE

# Crear cámara
echo "Creando cámara..." | tee -a $LOG_FILE
CAMARA_RESPONSE=$(curl -s -X POST "$BASE_URL/camaras" \
    -H "Content-Type: application/json" \
    -d '{"nombre":"CAMARA TEST","tipo":"FAENA","capacidad":1000}')

CAMARA_SUCCESS=$(echo "$CAMARA_RESPONSE" | grep -o '"success":[^,}]*' | cut -d':' -f2)
CAMARA_ID=$(echo "$CAMARA_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
log_result "Crear cámara" "true" "$CAMARA_SUCCESS" "$CAMARA_RESPONSE"

# Consultar stock
echo "Consultando stock de cámaras..." | tee -a $LOG_FILE
STOCK_RESPONSE=$(curl -s "$BASE_URL/stock")
STOCK_SUCCESS=$(echo "$STOCK_RESPONSE" | grep -o '"success":[^,}]*' | cut -d':' -f2)
log_result "Consultar stock" "true" "$STOCK_SUCCESS"

echo "" | tee -a $LOG_FILE
echo "=== 9. DESPACHOS ===" | tee -a $LOG_FILE

# Crear despacho
echo "Creando despacho..." | tee -a $LOG_FILE
DESPACHO_RESPONSE=$(curl -s -X POST "$BASE_URL/despachos" \
    -H "Content-Type: application/json" \
    -d "{\"clienteId\":\"$CLIENTE_ID\",\"operadorId\":\"$ADMIN_ID\",\"destino\":\"Destino Test\",\"kgTotal\":500}")

DESPACHO_SUCCESS=$(echo "$DESPACHO_RESPONSE" | grep -o '"success":[^,}]*' | cut -d':' -f2)
log_result "Crear despacho" "true" "$DESPACHO_SUCCESS" "$DESPACHO_RESPONSE"

echo "" | tee -a $LOG_FILE
echo "=== 10. SUBPRODUCTOS ===" | tee -a $LOG_FILE

# Crear menudencia
echo "Creando menudencia..." | tee -a $LOG_FILE
MENUD_RESPONSE=$(curl -s -X POST "$BASE_URL/menudencias" \
    -H "Content-Type: application/json" \
    -d '{"tipoMenudenciaId":"test","pesoIngreso":50}')

MENUD_SUCCESS=$(echo "$MENUD_RESPONSE" | grep -o '"success":[^,}]*' | cut -d':' -f2)
log_result "Crear menudencia" "true" "$MENUD_SUCCESS" "$MENUD_RESPONSE"

# Crear cuero
echo "Creando registro de cuero..." | tee -a $LOG_FILE
CUERO_RESPONSE=$(curl -s -X POST "$BASE_URL/cueros" \
    -H "Content-Type: application/json" \
    -d '{"numero":1,"peso":35,"conservacion":"SALADO"}')

CUERO_SUCCESS=$(echo "$CUERO_RESPONSE" | grep -o '"success":[^,}]*' | cut -d':' -f2)
log_result "Crear cuero" "true" "$CUERO_SUCCESS" "$CUERO_RESPONSE"

# Crear rendering
echo "Creando registro de rendering..." | tee -a $LOG_FILE
REND_RESPONSE=$(curl -s -X POST "$BASE_URL/rendering" \
    -H "Content-Type: application/json" \
    -d '{"tipo":"GRASA","peso":100,"operadorId":"$ADMIN_ID"}')

REND_SUCCESS=$(echo "$REND_RESPONSE" | grep -o '"success":[^,}]*' | cut -d':' -f2)
log_result "Crear rendering" "true" "$REND_SUCCESS" "$REND_RESPONSE"

echo "" | tee -a $LOG_FILE
echo "=== 11. CICLO II - DESPOSTADA ===" | tee -a $LOG_FILE

# Crear lote despostada
echo "Creando lote de despostada..." | tee -a $LOG_FILE
LOTE_RESPONSE=$(curl -s -X POST "$BASE_URL/lotes-despostada" \
    -H "Content-Type: application/json" \
    -d "{\"operadorId\":\"$ADMIN_ID\",\"observaciones\":\"Lote de prueba\"}")

LOTE_SUCCESS=$(echo "$LOTE_RESPONSE" | grep -o '"success":[^,}]*' | cut -d':' -f2)
LOTE_ID=$(echo "$LOTE_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
log_result "Crear lote despostada" "true" "$LOTE_SUCCESS" "$LOTE_RESPONSE"

# Crear movimiento despostada
if [ -n "$LOTE_ID" ]; then
    echo "Creando movimiento de despostada..." | tee -a $LOG_FILE
    MOV_DESP_RESPONSE=$(curl -s -X POST "$BASE_URL/movimientos-despostada" \
        -H "Content-Type: application/json" \
        -d "{\"loteId\":\"$LOTE_ID\",\"tipo\":\"CORTE\",\"productoNombre\":\"Bola de lomo\",\"pesoBruto\":50,\"pesoNeto\":45,\"operadorId\":\"$ADMIN_ID\"}")
    
    MOV_DESP_SUCCESS=$(echo "$MOV_DESP_RESPONSE" | grep -o '"success":[^,}]*' | cut -d':' -f2)
    log_result "Crear movimiento despostada" "true" "$MOV_DESP_SUCCESS" "$MOV_DESP_RESPONSE"
fi

echo "" | tee -a $LOG_FILE
echo "=== 12. REPORTES ===" | tee -a $LOG_FILE

# Consultar reportes
echo "Consultando reportes..." | tee -a $LOG_FILE
REPORTES_RESPONSE=$(curl -s "$BASE_URL/reportes")
REPORTES_SUCCESS=$(echo "$REPORTES_RESPONSE" | grep -o '"success":[^,}]*' | cut -d':' -f2)
log_result "Consultar reportes" "true" "$REPORTES_SUCCESS"

# Consultar auditoría
echo "Consultando auditoría..." | tee -a $LOG_FILE
AUDIT_RESPONSE=$(curl -s "$BASE_URL/auditoria")
AUDIT_SUCCESS=$(echo "$AUDIT_RESPONSE" | grep -o '"success":[^,}]*' | cut -d':' -f2)
log_result "Consultar auditoría" "true" "$AUDIT_SUCCESS"

echo "" | tee -a $LOG_FILE
echo "=== 13. VALIDACIONES Y ERRORES ===" | tee -a $LOG_FILE

# Probar validación de CUIT único
echo "Probando validación CUIT único..." | tee -a $LOG_FILE
CUIT_DUP_RESPONSE=$(curl -s -X POST "$BASE_URL/clientes" \
    -H "Content-Type: application/json" \
    -d '{"nombre":"DUPLICADO","cuit":"20-12345678-9"}')
CUIT_DUP_SUCCESS=$(echo "$CUIT_DUP_RESPONSE" | grep -o '"success":[^,}]*' | cut -d':' -f2)
if [ "$CUIT_DUP_SUCCESS" = "false" ]; then
    log_result "Validación CUIT único" "false" "false" "Correctamente rechazado"
    SUCCESSES=$((SUCCESSES + 1))
else
    echo "❌ Validación CUIT único: Debería haber fallado" | tee -a $LOG_FILE
    ERRORS=$((ERRORS + 1))
fi

# Probar login inválido
echo "Probando login con credenciales inválidas..." | tee -a $LOG_FILE
BAD_LOGIN=$(curl -s -X POST "$BASE_URL/auth" \
    -H "Content-Type: application/json" \
    -d '{"usuario":"admin","password":"wrongpassword"}')
BAD_LOGIN_SUCCESS=$(echo "$BAD_LOGIN" | grep -o '"success":[^,}]*' | cut -d':' -f2)
if [ "$BAD_LOGIN_SUCCESS" = "false" ]; then
    log_result "Login inválido rechazado" "false" "false" "Correctamente rechazado"
    SUCCESSES=$((SUCCESSES + 1))
else
    echo "❌ Login inválido: Debería haber fallado" | tee -a $LOG_FILE
    ERRORS=$((ERRORS + 1))
fi

echo "" | tee -a $LOG_FILE
echo "=========================================" | tee -a $LOG_FILE
echo "           RESUMEN FINAL" | tee -a $LOG_FILE
echo "=========================================" | tee -a $LOG_FILE
echo "Pruebas exitosas: $SUCCESSES" | tee -a $LOG_FILE
echo "Pruebas fallidas: $ERRORS" | tee -a $LOG_FILE
echo "Total pruebas: $((SUCCESSES + ERRORS))" | tee -a $LOG_FILE
if [ $ERRORS -eq 0 ]; then
    echo "🎉 ¡TODAS LAS PRUEBAS PASARON!" | tee -a $LOG_FILE
else
    echo "⚠️ Hay $ERRORS errores que requieren atención" | tee -a $LOG_FILE
fi
echo "=========================================" | tee -a $LOG_FILE

exit $ERRORS
