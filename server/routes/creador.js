const express = require("express");

function creadorRoutes(db){
  const router = express.Router();

  const EMAILS_CREADOR = ["alessio84force@gmail.com"];
  const PRECIO_MENSUAL_DEFECTO = 7.50;

  function escapar(valor){
    return String(valor || "")
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;")
      .replace(/'/g,"&#039;");
  }

  function euro(valor){
    return Number(valor || 0).toFixed(2) + " €";
  }

  function fecha(valor){
    if(!valor) return "-";
    try{
      const d = new Date(valor);
      if(isNaN(d.getTime())) return String(valor);
      return d.toLocaleDateString("es-ES");
    }catch(e){
      return String(valor);
    }
  }

  function diasRestantes(valor){
    if(!valor) return null;
    const fin = new Date(valor);
    if(isNaN(fin.getTime())) return null;
    const hoy = new Date();
    const diff = fin.getTime() - hoy.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  function estadoComercial(cliente){
    const estado = String(cliente.suscripcion_estado || "").toLowerCase();
    const trialFin = cliente.trial_fin;
    const dias = diasRestantes(trialFin);

    if(Number(cliente.bloqueado || 0) === 1){
      return "bloqueado";
    }

    if(estado === "activo" || estado === "pagado"){
      return "activo";
    }

    if(estado === "gratis_vida"){
      return "gratis_vida";
    }

    if(estado === "stripe_pendiente"){
      return "pendiente_pago";
    }

    if(dias !== null && dias < 0){
      return "trial_expirado";
    }

    if(estado === "trial" || estado === "prueba" || dias !== null){
      return "trial";
    }

    return estado || "sin_estado";
  }

  function requiereCreador(req,res,next){
    if(!req.session || !req.session.usuario){
      return res.redirect("/login");
    }

    const email = String(req.session.usuario.email || "").toLowerCase();
    const rol = String(req.session.usuario.rol || "").toLowerCase();

    if(EMAILS_CREADOR.includes(email) && rol === "admin"){
      return next();
    }

    return res.status(403).send(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Acceso creador denegado</title>
        <style>
          body{font-family:Arial,sans-serif;background:#f3f4f6;margin:0;padding:30px;color:#111827;}
          .box{max-width:520px;margin:80px auto;background:#fff;border-radius:20px;padding:28px;box-shadow:0 14px 34px rgba(0,0,0,.12);text-align:center;}
          a{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 16px;border-radius:14px;background:#111827;color:#fff;text-decoration:none;font-weight:900;}
          p{color:#6b7280;font-weight:700;}
        </style>
      </head>
      <body>
        <div class="box">
          <h1>Acceso no autorizado</h1>
          <p>Esta zona está reservada al creador del sistema.</p>
          <a href="/configuracion">Volver</a>
        </div>
      </body>
      </html>
    `);
  }

  function asegurarColumna(tabla, nombre, definicion, callback){
    db.all("PRAGMA table_info(" + tabla + ")", [], (err, columnas)=>{
      if(err) return callback(err);

      const existe = (columnas || []).some(c => c.name === nombre);
      if(existe) return callback(null);

      db.run("ALTER TABLE " + tabla + " ADD COLUMN " + nombre + " " + definicion, [], callback);
    });
  }

  function asegurarTablaCreador(callback){
    db.serialize(()=>{
      db.run(`
        CREATE TABLE IF NOT EXISTS creador_clientes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nombre_restaurante TEXT,
          propietario_nombre TEXT,
          propietario_email TEXT,
          propietario_telefono TEXT,
          usuario_id INTEGER,
          suscripcion_estado TEXT DEFAULT 'trial',
          trial_inicio TEXT,
          trial_fin TEXT,
          plan_tipo TEXT,
          promocion_aplicada TEXT,
          suscripcion_activada_en TEXT,
          stripe_customer_id TEXT,
          stripe_subscription_id TEXT,
          notas TEXT DEFAULT '',
          bloqueado INTEGER DEFAULT 0,
          creado_en TEXT DEFAULT CURRENT_TIMESTAMP,
          actualizado_en TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `, [], (err)=>{
        if(err) return callback(err);

        const columnas = [
          ["precio_mensual", "REAL DEFAULT 7.50"],
          ["moneda", "TEXT DEFAULT 'EUR'"],
          ["ultimo_pago_en", "TEXT"],
          ["proximo_pago_en", "TEXT"],
          ["origen", "TEXT DEFAULT 'registro'"]
        ];

        function siguiente(i){
          if(i >= columnas.length){
            return asegurarPagosCreador(callback);
          }

          asegurarColumna("creador_clientes", columnas[i][0], columnas[i][1], (errCol)=>{
            if(errCol) return callback(errCol);
            siguiente(i + 1);
          });
        }

        siguiente(0);
      });
    });
  }

  function asegurarPagosCreador(callback){
    db.run(`
      CREATE TABLE IF NOT EXISTS creador_pagos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cliente_id INTEGER,
        propietario_email TEXT,
        concepto TEXT,
        importe REAL DEFAULT 0,
        moneda TEXT DEFAULT 'EUR',
        estado TEXT DEFAULT 'pendiente',
        stripe_payment_id TEXT,
        stripe_invoice_id TEXT,
        creado_en TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `, [], (err)=>{
      if(err) return callback(err);

      sembrarClienteActual(callback);
    });
  }

  function sembrarClienteActual(callback){
    db.get("SELECT COUNT(*) AS total FROM creador_clientes", [], (errCount,row)=>{
      if(errCount) return callback(errCount);

      if(Number(row && row.total || 0) > 0){
        return callback(null);
      }

      db.get("SELECT * FROM configurazione WHERE id=1", [], (errConfig, config)=>{
        if(errConfig) return callback(errConfig);

        db.get("SELECT id,nombre,email,rol,activo,creado_en FROM usuarios WHERE LOWER(email)=LOWER(?)", [EMAILS_CREADOR[0]], (errUser, user)=>{
          if(errUser) return callback(errUser);

          const c = config || {};
          const u = user || {};

          db.run(`
            INSERT INTO creador_clientes (
              nombre_restaurante,
              propietario_nombre,
              propietario_email,
              propietario_telefono,
              usuario_id,
              suscripcion_estado,
              trial_inicio,
              trial_fin,
              plan_tipo,
              promocion_aplicada,
              suscripcion_activada_en,
              precio_mensual,
              moneda,
              origen
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
          `, [
            c.nome_ristorante || "Restaurant Service",
            c.propietario_nombre || u.nombre || "Creador",
            c.propietario_email || u.email || EMAILS_CREADOR[0],
            c.propietario_telefono || "",
            u.id || null,
            c.suscripcion_estado || "gratis_vida",
            c.trial_inicio || "",
            c.trial_fin || "",
            c.plan_tipo || "gratis_vida",
            c.promocion_aplicada || "",
            c.suscripcion_activada_en || "",
            0,
            "EUR",
            "sistema"
          ], callback);
        });
      });
    });
  }

  function cargarDatos(callback){
    asegurarTablaCreador((err)=>{
      if(err) return callback(err);

      db.all("SELECT * FROM creador_clientes ORDER BY creado_en DESC, id DESC", [], (errClientes, clientes)=>{
        if(errClientes) return callback(errClientes);

        db.all("SELECT * FROM creador_pagos ORDER BY creado_en DESC, id DESC LIMIT 50", [], (errPagos, pagos)=>{
          if(errPagos) return callback(errPagos);

          const mesActual = new Date().toISOString().slice(0,7);

          db.get(
            "SELECT COALESCE(SUM(importe),0) AS total FROM creador_pagos WHERE estado='pagado' AND substr(creado_en,1,7)=?",
            [mesActual],
            (errIngresosMes, ingresosMes)=>{
              if(errIngresosMes) return callback(errIngresosMes);

              callback(null, {
                clientes: clientes || [],
                pagos: pagos || [],
                ingresosMes: Number((ingresosMes && ingresosMes.total) || 0)
              });
            }
          );
        });
      });
    });
  }

  function calcularResumen(clientes, ingresosMesReal){
    const ahora = new Date();
    const mesActual = ahora.toISOString().slice(0,7);

    let nuevosMes = 0;
    let trialActivos = 0;
    let trialExpirados = 0;
    let activosPago = 0;
    let gratisVida = 0;
    let bloqueados = 0;
    let mrrEstimado = 0;

    clientes.forEach((c)=>{
      const estado = estadoComercial(c);
      const creadoMes = String(c.creado_en || "").slice(0,7);

      if(creadoMes === mesActual){
        nuevosMes++;
      }

      if(estado === "trial"){
        trialActivos++;
      }else if(estado === "trial_expirado"){
        trialExpirados++;
      }else if(estado === "activo"){
        activosPago++;
        mrrEstimado += Number(c.precio_mensual || PRECIO_MENSUAL_DEFECTO);
      }else if(estado === "gratis_vida"){
        gratisVida++;
      }else if(estado === "bloqueado"){
        bloqueados++;
      }
    });

    return {
      totalClientes: clientes.length,
      nuevosMes,
      trialActivos,
      trialExpirados,
      activosPago,
      gratisVida,
      bloqueados,
      mrrEstimado,
      ingresosMesReal
    };
  }

  function renderPanel(datos){
    const clientes = datos.clientes || [];
    const pagos = datos.pagos || [];
    const resumen = calcularResumen(clientes, datos.ingresosMes || 0);

    const clientesHtml = clientes.map((c)=>{
      const dias = diasRestantes(c.trial_fin);
      const estado = estadoComercial(c);
      const precio = estado === "gratis_vida" ? 0 : Number(c.precio_mensual || PRECIO_MENSUAL_DEFECTO);

      let diasTexto = "-";
      if(dias !== null){
        if(dias >= 0){
          diasTexto = dias + " días";
        }else{
          diasTexto = "Expirado hace " + Math.abs(dias) + " días";
        }
      }

      return `
        <tr>
          <td>
            <strong>${escapar(c.nombre_restaurante)}</strong>
            <br><small>ID cliente: ${escapar(c.id)}</small>
          </td>
          <td>
            ${escapar(c.propietario_nombre)}
            <br><small>${escapar(c.propietario_email)}</small>
            <br><small>${escapar(c.propietario_telefono || "")}</small>
          </td>
          <td><span class="badge ${escapar(estado)}">${escapar(estado)}</span></td>
          <td><strong>${euro(precio)}</strong><br><small>${escapar(c.plan_tipo || "-")}</small></td>
          <td>${fecha(c.creado_en)}</td>
          <td>${fecha(c.trial_inicio)}</td>
          <td>${fecha(c.trial_fin)}<br><strong>${escapar(diasTexto)}</strong></td>
          <td>${fecha(c.ultimo_pago_en)}</td>
          <td>${fecha(c.proximo_pago_en)}</td>
          <td>${escapar(c.promocion_aplicada || "-")}</td>
        </tr>
      `;
    }).join("");

    const pagosHtml = pagos.map((p)=>`
      <tr>
        <td>${fecha(p.creado_en)}</td>
        <td>${escapar(p.propietario_email)}</td>
        <td>${escapar(p.concepto || "Suscripción")}</td>
        <td><strong>${euro(p.importe)}</strong></td>
        <td><span class="badge ${escapar(p.estado)}">${escapar(p.estado)}</span></td>
        <td>${escapar(p.stripe_invoice_id || "-")}</td>
      </tr>
    `).join("");

    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Panel creador - Restaurant Service POS</title>
        <style>
          *{box-sizing:border-box;}
          body{margin:0;font-family:Arial,sans-serif;background:#f3f4f6;color:#111827;}
          header{background:#111827;color:white;padding:22px 28px;display:flex;justify-content:space-between;align-items:center;gap:16px;}
          header h1{margin:0;font-size:24px;}
          header p{margin:4px 0 0;color:#d1d5db;font-weight:700;}
          header a{color:white;text-decoration:none;background:#374151;padding:12px 16px;border-radius:14px;font-weight:900;margin-left:8px;}
          main{padding:26px;max-width:1500px;margin:0 auto;}
          .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:22px;}
          .card{background:white;border-radius:18px;padding:18px;box-shadow:0 8px 22px rgba(0,0,0,.08);}
          .card span{display:block;color:#6b7280;font-size:13px;font-weight:900;text-transform:uppercase;}
          .card strong{display:block;font-size:28px;margin-top:8px;}
          .card.money{background:#ecfdf5;border:1px solid #bbf7d0;}
          .card.money strong{color:#166534;}
          section{background:white;border-radius:20px;padding:20px;margin-bottom:22px;box-shadow:0 8px 22px rgba(0,0,0,.08);}
          h2{margin:0 0 8px;}
          .sub{margin:0 0 16px;color:#6b7280;font-weight:700;}
          table{width:100%;border-collapse:collapse;}
          th,td{padding:12px;border-bottom:1px solid #e5e7eb;text-align:left;vertical-align:top;font-size:14px;}
          th{font-size:12px;text-transform:uppercase;color:#6b7280;background:#f9fafb;}
          small{color:#6b7280;font-weight:700;}
          .badge{display:inline-flex;padding:6px 10px;border-radius:999px;background:#e5e7eb;font-weight:900;font-size:12px;}
          .badge.activo,.badge.pagado{background:#dcfce7;color:#166534;}
          .badge.trial{background:#dbeafe;color:#1d4ed8;}
          .badge.trial_expirado,.badge.bloqueado,.badge.fallido{background:#fee2e2;color:#991b1b;}
          .badge.gratis_vida{background:#fef3c7;color:#92400e;}
          .badge.pendiente_pago,.badge.pendiente{background:#fef9c3;color:#854d0e;}
          .nota{background:#eff6ff;border:1px solid #bfdbfe;color:#1e3a8a;border-radius:16px;padding:14px;margin-bottom:22px;font-weight:800;}
          @media(max-width:1000px){
            header{flex-direction:column;align-items:flex-start;}
            .grid{grid-template-columns:1fr 1fr;}
            table{font-size:12px;}
            th,td{padding:8px;}
          }
          @media(max-width:650px){
            .grid{grid-template-columns:1fr;}
          }
        </style>
      </head>
      <body>
        <header>
          <div>
            <h1>Panel creador</h1>
            <p>Dashboard comercial: clientes, pruebas gratuitas, suscripciones e ingresos propios.</p>
          </div>
          <div>
            <a href="/configuracion">Configuración</a>
            <a href="/logout">Salir</a>
          </div>
        </header>

        <main>
          <div class="nota">
            Este panel no muestra pedidos, caja ni facturación interna de los restaurantes. Solo muestra información comercial de Restaurant Service POS.
          </div>

          <div class="grid">
            <div class="card"><span>Clientes registrados</span><strong>${resumen.totalClientes}</strong></div>
            <div class="card"><span>Nuevos este mes</span><strong>${resumen.nuevosMes}</strong></div>
            <div class="card"><span>Pruebas activas</span><strong>${resumen.trialActivos}</strong></div>
            <div class="card"><span>Pruebas expiradas</span><strong>${resumen.trialExpirados}</strong></div>
            <div class="card"><span>Suscripciones activas</span><strong>${resumen.activosPago}</strong></div>
            <div class="card"><span>Gratis de por vida</span><strong>${resumen.gratisVida}</strong></div>
            <div class="card money"><span>MRR estimado</span><strong>${euro(resumen.mrrEstimado)}</strong></div>
            <div class="card money"><span>Ingresos cobrados este mes</span><strong>${euro(resumen.ingresosMesReal)}</strong></div>
          </div>

          <section>
            <h2>Clientes / restaurantes suscritos</h2>
            <p class="sub">Aquí debe aparecer un registro por cada restaurante que se registre en el sistema.</p>
            <table>
              <thead>
                <tr>
                  <th>Restaurante</th>
                  <th>Propietario</th>
                  <th>Estado</th>
                  <th>Precio mensual</th>
                  <th>Registro</th>
                  <th>Inicio prueba</th>
                  <th>Fin prueba</th>
                  <th>Último pago</th>
                  <th>Próximo pago</th>
                  <th>Promo</th>
                </tr>
              </thead>
              <tbody>
                ${clientesHtml || `<tr><td colspan="10">Todavía no hay clientes registrados.</td></tr>`}
              </tbody>
            </table>
          </section>

          <section>
            <h2>Pagos propios de Restaurant Service POS</h2>
            <p class="sub">Aquí aparecerán los pagos de Stripe cuando conectemos la suscripción real.</p>
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Concepto</th>
                  <th>Importe</th>
                  <th>Estado</th>
                  <th>Factura Stripe</th>
                </tr>
              </thead>
              <tbody>
                ${pagosHtml || `<tr><td colspan="6">Todavía no hay pagos propios registrados.</td></tr>`}
              </tbody>
            </table>
          </section>
        </main>
      </body>
      </html>
    `;
  }

  router.get("/api/creador/soy-creador", (req,res)=>{
    if(!req.session || !req.session.usuario){
      return res.status(401).json({
        ok:false,
        creador:false
      });
    }

    const email = String(req.session.usuario.email || "").toLowerCase();
    const rol = String(req.session.usuario.rol || "").toLowerCase();

    return res.json({
      ok:true,
      creador: EMAILS_CREADOR.includes(email) && rol === "admin",
      email,
      rol
    });
  });

  router.get("/creador", requiereCreador, (req,res)=>{
    cargarDatos((err, datos)=>{
      if(err){
        console.error("Error panel creador:", err.message);
        return res.status(500).send("Error cargando panel creador");
      }

      res.send(renderPanel(datos));
    });
  });

  return router;
}

module.exports = creadorRoutes;
