// Service worker da Expectrum.
//
// DELIBERADAMENTE MÍNIMO: ele NÃO faz cache de nada.
//
// Um SW que intercepta `fetch` e serve resposta guardada é a forma mais fácil
// de um aluno ver XP, ofensiva ou questão desatualizados — e este app já
// gastou uma migração inteira (supabase_ranking_fiel.sql) consertando número
// que mentia na tela. Cache aqui traria o mesmo problema de volta pela porta
// do navegador, onde nem dá pra invalidar do servidor.
//
// O que ele faz, e só isso:
//   • existe, que é o requisito pro app ser instalável (e, no iOS 16.4+, pro
//     Web Push funcionar);
//   • recebe push e mostra a notificação;
//   • leva o aluno pra tela certa quando ele toca nela.

self.addEventListener("install", () => {
  // Assume o controle sem esperar a aba antiga fechar. Sem isto, a primeira
  // visita instala o SW mas ele só passa a valer no próximo carregamento — e
  // o pedido de permissão de push logo em seguida falharia.
  self.skipWaiting();
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(self.clients.claim());
});

self.addEventListener("push", (evento) => {
  let dados = {};
  try {
    dados = evento.data ? evento.data.json() : {};
  } catch {
    // Payload que não é JSON: mostra algo em vez de engolir o push em
    // silêncio. Um push recebido e não exibido gasta a permissão do aluno
    // sem entregar nada.
    dados = {};
  }

  const titulo = dados.titulo || "Expectrum";
  const opcoes = {
    body: dados.corpo || "",
    icon: "/icone-192.png",
    badge: "/icone-192.png",
    // `tag` faz a notificação nova SUBSTITUIR a anterior do mesmo tipo em vez
    // de empilhar. Duas lembranças de ofensiva na bandeja não lembram duas
    // vezes — irritam uma vez.
    tag: dados.tag || "expectrum",
    renotify: false,
    data: { url: dados.url || "/dashboard" },
  };

  evento.waitUntil(self.registration.showNotification(titulo, opcoes));
});

self.addEventListener("notificationclick", (evento) => {
  evento.notification.close();
  const destino = (evento.notification.data && evento.notification.data.url) || "/dashboard";

  evento.waitUntil(
    // Se o app já está aberto numa aba, foca nela em vez de abrir uma
    // segunda — duas abas da mesma conta gastam o mesmo teto diário e
    // confundem o aluno sobre onde está o progresso dele.
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((abas) => {
      for (const aba of abas) {
        if (aba.url.includes(destino) && "focus" in aba) return aba.focus();
      }
      for (const aba of abas) {
        if ("navigate" in aba && "focus" in aba) {
          return aba.navigate(destino).then((a) => (a ? a.focus() : null));
        }
      }
      return self.clients.openWindow(destino);
    }),
  );
});
