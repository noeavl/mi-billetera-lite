# Mi Billetera Lite

PWA de gastos offline-first.

## Desarrollo local
```bash
npx serve .
# abre http://localhost:3000
```

## Despliegue a GitHub Pages
1. Push a repositorio GitHub
2. Settings → Pages → Source: "Deploy from a branch" → Branch: main / (root)
3. Espera a que termine el workflow
4. URL: https://<usuario>.github.io/<repo>/

## Verificación PWA
- Chrome DevTools → Lighthouse → PWA badge verde
- Network → Offline → F5 → Carga completa
- Agregar gasto offline → Cerrar/abrir pestaña → Persiste