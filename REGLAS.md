# 🚨 REGLAS OBLIGATORIAS - SISTEMA TRAZASOLE

## 📦 Repositorios GitHub

| Repositorio | Uso | Base de Datos | Remote |
|-------------|-----|---------------|--------|
| `1532` | Desarrollo | SQLite | `origin` |
| `trazasole` | Producción | PostgreSQL | `trazasole` |

## 🔄 AL FINALIZAR CADA SESIÓN

### 1. Verificar versión en package.json
```json
{
  "version": "X.Y.Z"
}
```

### 2. Actualizar worklog.md
- Agregar Task ID secuencial
- Documentar cambios realizados
- Incluir archivos modificados

### 3. Ejecutar SIEMPRE estos comandos:

```bash
# Commit con versión
git add -A
git commit -m "vX.Y.Z - Descripción del cambio"

# PUSH A AMBOS REPOSITORIOS (OBLIGATORIO)
git push origin master          # 1532 (desarrollo)
git push trazasole master       # trazasole (producción)
```

### 4. Verificar en GitHub
- https://github.com/aarescalvo/1532
- https://github.com/aarescalvo/trazasole

---

## ⚠️ COMANDOS GIT CONFIGURADOS

```bash
# Configurar remotos (solo una vez)
git remote add origin https://github.com/aarescalvo/1532.git
git remote add trazasole https://github.com/aarescalvo/trazasole.git

# Verificar remotos
git remote -v

# Push a ambos (EJECUTAR SIEMPRE)
git push origin master && git push trazasole master
```

---

## 📋 CHECKLIST FINAL

| # | Tarea | Comando/Acción |
|---|-------|----------------|
| 1 | ¿Versión actualizada? | Editar `package.json` |
| 2 | ¿Worklog actualizado? | Editar `worklog.md` |
| 3 | ¿Lint sin errores? | `bun run lint` |
| 4 | ¿Commit con versión? | `git commit -m "vX.Y.Z - ..."` |
| 5 | ¿Push a 1532? | `git push origin master` |
| 6 | ¿Push a trazasole? | `git push trazasole master` |
| 7 | ¿Verificar en GitHub? | Ambos repos actualizados |

---

## 🏷️ Versionado

- **Major (X.0.0)**: Cambios grandes, nuevos módulos
- **Minor (0.X.0)**: Nuevas funcionalidades
- **Patch (0.0.X)**: Bug fixes, mejoras menores

**Versión actual: 3.0.2**
