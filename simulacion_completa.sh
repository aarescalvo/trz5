#!/bin/bash

# SIMULACIÓN COMPLETA DEL SISTEMA FRIGORÍFICO
# Fecha: $(date)

BASE_URL="http://localhost:3000/api"
FAILURES=0
SUCCESSES=0
TOTAL=0

echo "========================================="
echo "   SIMULACIÓN COMPLETA DEL SISTEMA"
echo "   $(date)"
echo "========================================="
echo ""

# Función para testear endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local method=${3:-GET}
    local data=${4:-}
    
    TOTAL=$((TOTAL + 1))
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$url" 2>/dev/null)
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" -H "Content-Type: application/json" -d "$data" "$url" 2>/dev/null)
    fi
    
    http_code=$(echo "$response" | tail -1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        echo "✅ $name: $http_code"
        SUCCESSES=$((SUCCESSES + 1))
    else
        echo "❌ $name: $http_code"
        if [ -n "$body" ]; then
            echo "   Error: $(echo "$body" | head -c 200)"
        fi
        FAILURES=$((FAILURES + 1))
    fi
}

echo "=== CICLO I: RECEPCIÓN Y FAENA ==="
test_endpoint "Dashboard" "$BASE_URL/dashboard"
test_endpoint "Tropas" "$BASE_URL/tropas"
test_endpoint "Animales" "$BASE_URL/animales"
test_endpoint "Pesaje Camión" "$BASE_URL/pesaje-camion"
test_endpoint "Corrales" "$BASE_URL/corrales"
test_endpoint "Lista Faena" "$BASE_URL/lista-faena"
test_endpoint "Garrones Asignados" "$BASE_URL/garrones-asignados"
test_endpoint "Cuarteo" "$BASE_URL/cuarteo"
echo ""

echo "=== CICLO II: DESPOSTADA ==="
test_endpoint "Lotes Despostada" "$BASE_URL/lotes-despostada"
test_endpoint "Ingreso Despostada" "$BASE_URL/ingreso-despostada"
test_endpoint "Movimientos Despostada" "$BASE_URL/movimientos-despostada"
test_endpoint "Productos" "$BASE_URL/productos"
echo ""

echo "=== SUBPRODUCTOS Y MENUDENCIAS ==="
test_endpoint "Menudencias" "$BASE_URL/menudencias"
test_endpoint "Rendering" "$BASE_URL/rendering"
test_endpoint "Cueros" "$BASE_URL/cueros"
echo ""

echo "=== STOCK Y CÁMARAS ==="
test_endpoint "Cámaras" "$BASE_URL/camaras"
test_endpoint "Movimiento Cámaras" "$BASE_URL/movimiento-camaras"
test_endpoint "Despachos" "$BASE_URL/despachos"
test_endpoint "Empaque" "$BASE_URL/empaque"
test_endpoint "Expedición" "$BASE_URL/expedicion"
echo ""

echo "=== INSUMOS Y CONFIGURACIÓN ==="
test_endpoint "Insumos" "$BASE_URL/insumos"
test_endpoint "Clientes" "$BASE_URL/clientes"
test_endpoint "Operadores" "$BASE_URL/operadores"
test_endpoint "Configuración" "$BASE_URL/configuracion"
test_endpoint "Transportistas" "$BASE_URL/transportistas"
echo ""

echo "=== DOCUMENTACIÓN Y REPORTES ==="
test_endpoint "Reportes" "$BASE_URL/reportes"
test_endpoint "CCIR" "$BASE_URL/ccir"
test_endpoint "Declaración Jurada" "$BASE_URL/declaracion-jurada"
test_endpoint "Planilla01" "$BASE_URL/planilla01"
test_endpoint "Facturación" "$BASE_URL/facturacion"
test_endpoint "Auditoría" "$BASE_URL/auditoria"
echo ""

echo "=== CALIDAD Y TrazABILIDAD ==="
test_endpoint "Búsqueda" "$BASE_URL/busqueda?q=test"
test_endpoint "Código de Barras" "$BASE_URL/codigo-barras"
test_endpoint "Calidad Reclamos" "$BASE_URL/calidad-reclamos"
test_endpoint "Condiciones Embalaje" "$BASE_URL/condiciones-embalaje"
test_endpoint "Ingreso Cajón" "$BASE_URL/ingreso-cajon"
echo ""

echo "=== AUTENTICACIÓN ==="
test_endpoint "Auth (sin params)" "$BASE_URL/auth"
echo ""

echo "========================================="
echo "           RESUMEN FINAL"
echo "========================================="
echo "Total endpoints probados: $TOTAL"
echo "Exitosos: $SUCCESSES"
echo "Fallidos: $FAILURES"
echo "Porcentaje éxito: $((SUCCESSES * 100 / TOTAL))%"
echo "========================================="

if [ $FAILURES -eq 0 ]; then
    echo "🎉 ¡TODOS LOS MÓDULOS FUNCIONANDO CORRECTAMENTE!"
    exit 0
else
    echo "⚠️ Hay módulos con errores que requieren atención"
    exit 1
fi
