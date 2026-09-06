// Gerador do lote 2 de Química Geral — a matéria tinha só 8 questões (2 por
// tópico). Estilo Brown, "Química: A Ciência Central", com maioria conceitual
// (preferência do usuário) e uma parcela computacional nos pontos da ementa
// que pedem conta (Born-Haber, entalpia, cinética, equilíbrio, eletrólise).
// Rode: node listas_questoes/gerado/scripts/quimica_geral_lote2.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const R = String.raw;
const MATERIA = "Química Geral";

const q = (topico, subtopico, dificuldade, enunciado, alternativas, gabarito, resolucao) => ({
  materia: MATERIA,
  topico,
  subtopico,
  dificuldade,
  enunciado,
  alternativas,
  gabarito,
  resolucao,
  instituicao: null,
  ano: null,
  tikz_code: null,
});

const questoes = [
  q(
    "Estrutura Atômica e Tabela Periódica",
    "Energia da radiação eletromagnética",
    "medio",
    R`Calcule a energia de um fóton de luz violeta de comprimento de onda $400$ nm. Use $h=6{,}626\times 10^{-34}$ J·s e $c=3{,}00\times 10^{8}$ m/s.`,
    {
      a: R`$2{,}48\times 10^{-19}$ J`,
      b: R`$7{,}95\times 10^{-19}$ J`,
      c: R`$4{,}97\times 10^{-19}$ J`,
      d: R`$4{,}97\times 10^{-20}$ J`,
      e: R`$1{,}99\times 10^{-18}$ J`,
    },
    "c",
    R`A energia de um fóton é $E=h\nu=\dfrac{hc}{\lambda}$. Convertendo $400$ nm para $4{,}00\times 10^{-7}$ m: $E=\dfrac{\left(6{,}626\times 10^{-34}\right)\left(3{,}00\times 10^{8}\right)}{4{,}00\times 10^{-7}}=\dfrac{1{,}99\times 10^{-25}}{4{,}00\times 10^{-7}}=4{,}97\times 10^{-19}$ J.`
  ),
  q(
    "Estrutura Atômica e Tabela Periódica",
    "Modelo de Bohr: níveis de energia",
    "facil",
    R`No modelo de Bohr para o átomo de hidrogênio, a energia do nível $n$ é $E_n=-\dfrac{13{,}6}{n^2}$ eV. Determine a energia do nível $n=3$.`,
    {
      a: R`$-1{,}51$ eV`,
      b: R`$-3{,}40$ eV`,
      c: R`$-13{,}6$ eV`,
      d: R`$-0{,}85$ eV`,
      e: R`$-4{,}53$ eV`,
    },
    "a",
    R`Substituindo $n=3$: $E_3=-\dfrac{13{,}6}{3^2}=-\dfrac{13{,}6}{9}\approx -1{,}51$ eV. Os valores $-3{,}40$ eV e $-0{,}85$ eV correspondem a $n=2$ e $n=4$, respectivamente.`
  ),
  q(
    "Estrutura Atômica e Tabela Periódica",
    "Transição eletrônica e espectro",
    "medio",
    R`Um elétron do átomo de hidrogênio decai do nível $n=3$ para $n=2$. Sabendo que $E_n=-\dfrac{13{,}6}{n^2}$ eV e que $\lambda(\text{nm})=\dfrac{1240}{E(\text{eV})}$, determine o comprimento de onda do fóton emitido.`,
    { a: R`$486$ nm`, b: R`$434$ nm`, c: R`$121$ nm`, d: R`$656$ nm`, e: R`$820$ nm` },
    "d",
    R`A energia liberada é $\Delta E=13{,}6\left(\dfrac{1}{2^2}-\dfrac{1}{3^2}\right)=13{,}6\cdot\dfrac{5}{36}\approx 1{,}89$ eV. Então $\lambda=\dfrac{1240}{1{,}89}\approx 656$ nm — a risca vermelha $H_\alpha$ da série de Balmer.`
  ),
  q(
    "Estrutura Atômica e Tabela Periódica",
    "Dualidade partícula-onda",
    "medio",
    R`Calcule o comprimento de onda de de Broglie de um elétron que se move a $1{,}0\times 10^{6}$ m/s. Use $h=6{,}626\times 10^{-34}$ J·s e $m_e=9{,}11\times 10^{-31}$ kg.`,
    {
      a: R`$1{,}4\times 10^{-10}$ m`,
      b: R`$7{,}3\times 10^{-10}$ m`,
      c: R`$7{,}3\times 10^{-9}$ m`,
      d: R`$3{,}6\times 10^{-10}$ m`,
      e: R`$7{,}3\times 10^{-12}$ m`,
    },
    "b",
    R`Pela relação de de Broglie, $\lambda=\dfrac{h}{mv}=\dfrac{6{,}626\times 10^{-34}}{\left(9{,}11\times 10^{-31}\right)\left(1{,}0\times 10^{6}\right)}=\dfrac{6{,}626\times 10^{-34}}{9{,}11\times 10^{-25}}\approx 7{,}3\times 10^{-10}$ m. É da ordem das distâncias interatômicas, o que explica a difração de elétrons por cristais.`
  ),
  q(
    "Estrutura Atômica e Tabela Periódica",
    "Configuração eletrônica de íons",
    "medio",
    R`O ferro tem número atômico $26$. Determine a configuração eletrônica do íon $\text{Fe}^{3+}$.`,
    {
      a: R`$[\text{Ar}]3d^{6}$`,
      b: R`$[\text{Ar}]3d^{3}4s^{2}$`,
      c: R`$[\text{Ar}]3d^{4}4s^{1}$`,
      d: R`$[\text{Ar}]3d^{5}4s^{1}$`,
      e: R`$[\text{Ar}]3d^{5}$`,
    },
    "e",
    R`O ferro neutro é $[\text{Ar}]3d^{6}4s^{2}$. Ao formar cátions, os metais de transição perdem primeiro os elétrons do subnível $4s$, e só depois os do $3d$. Removendo os dois elétrons $4s$ e um elétron $3d$, chega-se a $[\text{Ar}]3d^{5}$ — configuração de subnível semipreenchido, particularmente estável.`
  ),
  q(
    "Estrutura Atômica e Tabela Periódica",
    "Números quânticos e capacidade de camada",
    "facil",
    R`Determine o número máximo de elétrons que podem ocupar a camada com número quântico principal $n=4$.`,
    { a: R`$32$`, b: R`$18$`, c: R`$8$`, d: R`$16$`, e: R`$50$` },
    "a",
    R`Para um dado $n$ há $n$ subníveis, com $\ell=0,1,\dots,n-1$, totalizando $n^2$ orbitais. Pelo princípio da exclusão de Pauli, cada orbital comporta $2$ elétrons, logo a camada suporta $2n^2$. Para $n=4$: $2(16)=32$.`
  ),
  q(
    "Estrutura Atômica e Tabela Periódica",
    "Tendências periódicas: raio atômico",
    "facil",
    R`Coloque os elementos $\text{Mg}$, $\text{Na}$ e $\text{K}$ em ordem crescente de raio atômico.`,
    {
      a: R`$\text{Na}<\text{Mg}<\text{K}$`,
      b: R`$\text{K}<\text{Na}<\text{Mg}$`,
      c: R`$\text{Mg}<\text{Na}<\text{K}$`,
      d: R`$\text{Mg}<\text{K}<\text{Na}$`,
      e: R`$\text{Na}<\text{K}<\text{Mg}$`,
    },
    "c",
    R`Ao longo de um período, o raio atômico diminui, pois a carga nuclear efetiva cresce sem que se acrescente uma camada: por isso $\text{Mg}<\text{Na}$. Ao descer um grupo, o raio aumenta pela adição de camadas: por isso $\text{Na}<\text{K}$. A ordem é $\text{Mg}<\text{Na}<\text{K}$.`
  ),
  q(
    "Estrutura Atômica e Tabela Periódica",
    "Tendências periódicas: energia de ionização",
    "medio",
    R`Entre os elementos $\text{Li}$, $\text{Be}$, $\text{B}$, $\text{C}$ e $\text{N}$, todos do segundo período, qual apresenta a maior primeira energia de ionização?`,
    { a: R`$\text{C}$`, b: R`$\text{N}$`, c: R`$\text{B}$`, d: R`$\text{Be}$`, e: R`$\text{Li}$` },
    "b",
    R`A energia de ionização cresce ao longo do período, de modo que o nitrogênio, o mais à direita da lista, tem a maior. Some-se a isso o subnível $2p$ semipreenchido ($2p^3$), configuração de estabilidade extra. Vale notar a anomalia $\text{Be}>\text{B}$: remover um elétron $2p$ do boro é mais fácil do que romper o $2s$ completo do berílio.`
  ),
  q(
    "Ligações Químicas",
    "Ciclo de Born-Haber",
    "dificil",
    R`Para o $\text{NaCl}$ são conhecidos: $\Delta H_f^{\circ}=-411$ kJ/mol; sublimação do $\text{Na}$, $+108$; primeira ionização do $\text{Na}$, $+496$; metade da dissociação do $\text{Cl}_2$, $+122$; afinidade eletrônica do $\text{Cl}$, $-349$. Determine a energia reticular do $\text{NaCl}$.`,
    {
      a: R`$-411$ kJ/mol`,
      b: R`$-377$ kJ/mol`,
      c: R`$+788$ kJ/mol`,
      d: R`$-788$ kJ/mol`,
      e: R`$-1165$ kJ/mol`,
    },
    "d",
    R`Pela lei de Hess aplicada ao ciclo, $\Delta H_f^{\circ}$ é a soma de todas as etapas: $\Delta H_f^{\circ}=\Delta H_{sub}+I+\tfrac12 D+AE+U$. Substituindo: $-411=108+496+122-349+U=377+U$, de onde $U=-788$ kJ/mol. O sinal negativo indica liberação de energia na formação do retículo a partir dos íons gasosos.`
  ),
  q(
    "Ligações Químicas",
    "Eletronegatividade e polaridade",
    "facil",
    R`Qual das ligações abaixo é a mais polar?`,
    { a: R`$\text{H}\!-\!\text{F}$`, b: R`$\text{H}\!-\!\text{Cl}$`, c: R`$\text{H}\!-\!\text{Br}$`, d: R`$\text{H}\!-\!\text{I}$`, e: R`$\text{F}\!-\!\text{F}$` },
    "a",
    R`A polaridade de uma ligação cresce com a diferença de eletronegatividade entre os átomos. O flúor é o elemento mais eletronegativo da tabela, e a eletronegatividade decresce ao descer o grupo dos halogênios, logo a diferença em relação ao hidrogênio é máxima em $\text{H}\!-\!\text{F}$. Já $\text{F}\!-\!\text{F}$ é apolar, por unir átomos idênticos.`
  ),
  q(
    "Ligações Químicas",
    "Hibridização",
    "facil",
    R`Determine a hibridização do átomo central na molécula de $\text{BF}_3$.`,
    { a: R`$sp^3$`, b: R`$sp$`, c: R`$sp^2$`, d: R`$sp^3d$`, e: R`$sp^3d^2$` },
    "c",
    R`O boro no $\text{BF}_3$ faz três ligações e não possui pares isolados, totalizando três domínios eletrônicos ao seu redor. Três domínios correspondem a hibridização $sp^2$ e geometria trigonal plana, com ângulos de $120^{\circ}$. Trata-se de uma exceção à regra do octeto (o boro fica com apenas $6$ elétrons).`
  ),
  q(
    "Ligações Químicas",
    "Geometria molecular (VSEPR)",
    "facil",
    R`Determine a geometria molecular da amônia, $\text{NH}_3$.`,
    {
      a: R`trigonal plana`,
      b: R`tetraédrica`,
      c: R`angular`,
      d: R`linear`,
      e: R`piramidal trigonal`,
    },
    "e",
    R`O nitrogênio tem quatro domínios eletrônicos: três ligações e um par isolado. A disposição dos domínios é tetraédrica, mas a geometria molecular considera apenas as posições dos átomos, resultando em pirâmide de base triangular. A repulsão extra do par isolado fecha o ângulo de $109{,}5^{\circ}$ para cerca de $107^{\circ}$.`
  ),
  q(
    "Ligações Químicas",
    "Carga formal",
    "medio",
    R`Determine a carga formal do átomo de nitrogênio no íon amônio, $\text{NH}_4^{+}$.`,
    { a: R`$0$`, b: R`$+1$`, c: R`$-1$`, d: R`$+2$`, e: R`$-3$` },
    "b",
    R`A carga formal é dada por $CF=(\text{elétrons de valência})-(\text{elétrons não ligantes})-\tfrac12(\text{elétrons ligantes})$. O nitrogênio tem $5$ elétrons de valência, nenhum par isolado no $\text{NH}_4^{+}$ e quatro ligações simples ($8$ elétrons compartilhados): $CF=5-0-4=+1$. A carga do íon está formalmente sobre o nitrogênio.`
  ),
  q(
    "Ligações Químicas",
    "Ligação metálica e teoria de bandas",
    "medio",
    R`De acordo com a teoria de bandas, a alta condutividade elétrica dos metais decorre da existência de:`,
    {
      a: R`banda parcialmente preenchida`,
      b: R`ligações covalentes direcionais`,
      c: R`banda proibida muito larga`,
      d: R`íons móveis no retículo`,
      e: R`elétrons fortemente localizados`,
    },
    "a",
    R`Nos metais, os orbitais atômicos se combinam formando bandas contínuas, e a banda de valência fica apenas parcialmente ocupada (ou se sobrepõe à banda de condução). Assim há estados vazios imediatamente acima dos ocupados, e um campo elétrico mínimo já acelera os elétrons. Uma banda proibida larga caracteriza um isolante, e íons móveis explicam a condução em eletrólitos, não em metais.`
  ),
  q(
    "Ligações Químicas",
    "Forças intermoleculares e ponto de ebulição",
    "facil",
    R`Qual das substâncias abaixo apresenta o maior ponto de ebulição à pressão de $1$ atm?`,
    { a: R`$\text{CH}_4$`, b: R`$\text{H}_2\text{S}$`, c: R`$\text{NH}_3$`, d: R`$\text{H}_2\text{O}$`, e: R`$\text{HF}$` },
    "d",
    R`Todas as três últimas fazem ligações de hidrogênio, mas a água é a única em que cada molécula pode participar de até quatro dessas ligações (dois hidrogênios doadores e dois pares isolados receptores), formando uma rede tridimensional. Por isso seu ponto de ebulição ($100\,^{\circ}$C) supera o do $\text{HF}$ e o da $\text{NH}_3$. O $\text{CH}_4$, apolar, tem o menor de todos.`
  ),
  q(
    "Ligações Químicas",
    "Forças intermoleculares em molécula apolar",
    "medio",
    R`Qual força intermolecular predomina entre as moléculas de $\text{CO}_2$ no estado condensado?`,
    {
      a: R`ligação de hidrogênio`,
      b: R`interação dipolo–dipolo`,
      c: R`dispersão de London`,
      d: R`interação íon–dipolo`,
      e: R`ligação iônica`,
    },
    "c",
    R`Embora cada ligação $\text{C}=\text{O}$ seja polar, o $\text{CO}_2$ é linear e os dois vetores de momento dipolar se cancelam, tornando a molécula apolar. Sem dipolo permanente e sem hidrogênio ligado a $\text{F}$, $\text{O}$ ou $\text{N}$, restam apenas os dipolos instantâneos das forças de dispersão de London.`
  ),
  q(
    "Termodinâmica, Cinética e Equilíbrio",
    "Entalpia de reação por entalpias de formação",
    "medio",
    R`Calcule $\Delta H^{\circ}$ da combustão $\text{CH}_4(g)+2\text{O}_2(g)\rightarrow\text{CO}_2(g)+2\text{H}_2\text{O}(l)$, dados $\Delta H_f^{\circ}$: $\text{CH}_4(g)=-74{,}8$; $\text{CO}_2(g)=-393{,}5$; $\text{H}_2\text{O}(l)=-285{,}8$ kJ/mol.`,
    {
      a: R`$-604{,}5$ kJ`,
      b: R`$-965{,}1$ kJ`,
      c: R`$+890{,}3$ kJ`,
      d: R`$-802{,}3$ kJ`,
      e: R`$-890{,}3$ kJ`,
    },
    "e",
    R`Vale $\Delta H^{\circ}=\sum\Delta H_f^{\circ}(\text{produtos})-\sum\Delta H_f^{\circ}(\text{reagentes})$, lembrando que $\Delta H_f^{\circ}$ de substância simples no estado padrão, como o $\text{O}_2$, é zero. Assim $\Delta H^{\circ}=\left[-393{,}5+2(-285{,}8)\right]-\left[-74{,}8\right]=-965{,}1+74{,}8=-890{,}3$ kJ.`
  ),
  q(
    "Termodinâmica, Cinética e Equilíbrio",
    "Lei de velocidade e ordem de reação",
    "medio",
    R`Na reação $\text{A}+\text{B}\rightarrow\text{produtos}$, dobrar $[\text{A}]$ quadruplica a velocidade, enquanto dobrar $[\text{B}]$ não a altera. Determine a ordem global da reação.`,
    { a: R`$1$`, b: R`$2$`, c: R`$3$`, d: R`$0$`, e: R`$4$` },
    "b",
    R`Se dobrar $[\text{A}]$ multiplica a velocidade por $4=2^2$, a ordem em relação a $\text{A}$ é $2$. Se dobrar $[\text{B}]$ não altera nada, a ordem em relação a $\text{B}$ é $0$. A lei é $v=k[\text{A}]^2$ e a ordem global é $2+0=2$. Note que as ordens são determinadas experimentalmente, não pelos coeficientes da equação.`
  ),
  q(
    "Termodinâmica, Cinética e Equilíbrio",
    "Cinética de primeira ordem",
    "facil",
    R`Uma reação de primeira ordem tem constante de velocidade $k=0{,}0693$ min$^{-1}$. Determine sua meia-vida.`,
    { a: R`$10$ min`, b: R`$5{,}0$ min`, c: R`$20$ min`, d: R`$14{,}4$ min`, e: R`$6{,}93$ min` },
    "a",
    R`Para uma reação de primeira ordem, $t_{1/2}=\dfrac{\ln 2}{k}=\dfrac{0{,}693}{0{,}0693}=10$ min. Diferentemente das outras ordens, essa meia-vida não depende da concentração inicial.`
  ),
  q(
    "Termodinâmica, Cinética e Equilíbrio",
    "Efeito da temperatura na velocidade",
    "facil",
    R`Um aumento de temperatura acelera acentuadamente a maioria das reações químicas porque:`,
    {
      a: R`diminui a energia de ativação`,
      b: R`aumenta a entalpia da reação`,
      c: R`aumenta a constante de equilíbrio`,
      d: R`aumenta a fração de colisões eficazes`,
      e: R`aumenta a concentração dos reagentes`,
    },
    "d",
    R`Pela distribuição de Maxwell-Boltzmann, elevar a temperatura desloca a curva para energias maiores e aumenta muito a fração de colisões cuja energia supera a energia de ativação — efeito exponencial, como mostra a equação de Arrhenius $k=Ae^{-E_a/RT}$. A energia de ativação em si não muda com a temperatura; quem a reduz é um catalisador.`
  ),
  q(
    "Termodinâmica, Cinética e Equilíbrio",
    "Constante de equilíbrio",
    "medio",
    R`Para $\text{N}_2\text{O}_4(g)\rightleftharpoons 2\,\text{NO}_2(g)$, tem-se $K_c=0{,}36$ a certa temperatura. Se no equilíbrio $\left[\text{N}_2\text{O}_4\right]=0{,}10$ mol/L, determine $\left[\text{NO}_2\right]$.`,
    { a: R`$0{,}036$ M`, b: R`$0{,}060$ M`, c: R`$0{,}19$ M`, d: R`$0{,}38$ M`, e: R`$0{,}10$ M` },
    "c",
    R`A expressão da constante é $K_c=\dfrac{\left[\text{NO}_2\right]^2}{\left[\text{N}_2\text{O}_4\right]}$. Isolando: $\left[\text{NO}_2\right]^2=K_c\left[\text{N}_2\text{O}_4\right]=0{,}36\times 0{,}10=0{,}036$, logo $\left[\text{NO}_2\right]=\sqrt{0{,}036}\approx 0{,}19$ mol/L. O expoente $2$ vem do coeficiente estequiométrico.`
  ),
  q(
    "Termodinâmica, Cinética e Equilíbrio",
    "Princípio de Le Chatelier",
    "medio",
    R`No equilíbrio $\text{N}_2(g)+3\text{H}_2(g)\rightleftharpoons 2\,\text{NH}_3(g)$, com $\Delta H<0$, qual é o efeito de um aumento de temperatura?`,
    {
      a: R`desloca para os reagentes`,
      b: R`desloca para os produtos`,
      c: R`não altera o equilíbrio`,
      d: R`altera apenas a pressão total`,
      e: R`aumenta o valor de $K_c$`,
    },
    "a",
    R`Numa reação exotérmica, o calor pode ser tratado como produto. Aumentar a temperatura equivale a adicionar produto, e pelo princípio de Le Chatelier o sistema responde deslocando-se no sentido dos reagentes, o que também diminui $K_c$. É por isso que o processo Haber-Bosch usa temperaturas apenas moderadas, compensando com pressão elevada e catalisador.`
  ),
  q(
    "Termodinâmica, Cinética e Equilíbrio",
    "Número de oxidação",
    "facil",
    R`Determine o número de oxidação do cromo no íon dicromato, $\text{Cr}_2\text{O}_7^{2-}$.`,
    { a: R`$+3$`, b: R`$+2$`, c: R`$+7$`, d: R`$+12$`, e: R`$+6$` },
    "e",
    R`O oxigênio tem número de oxidação $-2$ e a soma dos números de oxidação deve igualar a carga do íon: $2x+7(-2)=-2$. Então $2x=12$ e $x=+6$. É esse estado $+6$, altamente oxidante, que faz do dicromato um reagente clássico em titulações de oxirredução.`
  ),
  q(
    "Termodinâmica, Cinética e Equilíbrio",
    "Potencial de célula galvânica",
    "medio",
    R`Calcule a força eletromotriz padrão da pilha de Daniell, $\text{Zn}\left|\text{Zn}^{2+}\right|\left|\text{Cu}^{2+}\right|\text{Cu}$, dados $E^{\circ}\left(\text{Cu}^{2+}/\text{Cu}\right)=+0{,}34$ V e $E^{\circ}\left(\text{Zn}^{2+}/\text{Zn}\right)=-0{,}76$ V.`,
    { a: R`$+0{,}42$ V`, b: R`$+1{,}10$ V`, c: R`$-1{,}10$ V`, d: R`$+0{,}34$ V`, e: R`$-0{,}42$ V` },
    "b",
    R`Vale $E^{\circ}_{cel}=E^{\circ}_{c\acute{a}todo}-E^{\circ}_{\hat{a}nodo}$. O cobre, de maior potencial de redução, é o cátodo; o zinco é o ânodo e se oxida. Assim $E^{\circ}_{cel}=0{,}34-(-0{,}76)=+1{,}10$ V. O valor positivo confirma que a reação é espontânea.`
  ),
  q(
    "Termodinâmica, Cinética e Equilíbrio",
    "Eletrólise e leis de Faraday",
    "medio",
    R`Determine a massa de cobre depositada na eletrólise de uma solução de $\text{CuSO}_4$ pela passagem de $9650$ C. Use $F=96500$ C/mol e $M(\text{Cu})=63{,}5$ g/mol.`,
    { a: R`$6{,}35$ g`, b: R`$1{,}59$ g`, c: R`$12{,}7$ g`, d: R`$3{,}18$ g`, e: R`$0{,}05$ g` },
    "d",
    R`A carga corresponde a $n_{e^-}=\dfrac{9650}{96500}=0{,}100$ mol de elétrons. Como a semirreação é $\text{Cu}^{2+}+2e^-\rightarrow\text{Cu}$, são necessários $2$ mol de elétrons por mol de cobre, logo $n_{Cu}=0{,}050$ mol. A massa é $0{,}050\times 63{,}5\approx 3{,}18$ g.`
  ),
  q(
    "Funções Inorgânicas e Reações Químicas",
    "Classificação de óxidos",
    "facil",
    R`Qual das substâncias abaixo é um óxido de caráter básico?`,
    { a: R`$\text{CO}_2$`, b: R`$\text{SO}_3$`, c: R`$\text{CaO}$`, d: R`$\text{NaCl}$`, e: R`$\text{HCl}$` },
    "c",
    R`Óxidos básicos são formados por metais de baixa eletronegatividade e reagem com água produzindo bases: $\text{CaO}+\text{H}_2\text{O}\rightarrow\text{Ca(OH)}_2$. Já $\text{CO}_2$ e $\text{SO}_3$ são óxidos ácidos (anidridos), que geram $\text{H}_2\text{CO}_3$ e $\text{H}_2\text{SO}_4$. O $\text{NaCl}$ é um sal e o $\text{HCl}$, um ácido.`
  ),
  q(
    "Funções Inorgânicas e Reações Químicas",
    "Nomenclatura inorgânica",
    "facil",
    R`Qual é o nome do composto de fórmula $\text{Ca(OH)}_2$, a cal hidratada usada em argamassas?`,
    {
      a: R`hidróxido de cálcio`,
      b: R`carbonato de cálcio`,
      c: R`óxido de cálcio`,
      d: R`hidreto de cálcio`,
      e: R`peróxido de cálcio`,
    },
    "a",
    R`A presença do grupo $\text{OH}^-$ caracteriza uma base, cujo nome é "hidróxido de" seguido do cátion: hidróxido de cálcio. O carbonato seria $\text{CaCO}_3$ (calcário), o óxido seria $\text{CaO}$ (cal virgem), o hidreto $\text{CaH}_2$ e o peróxido $\text{CaO}_2$.`
  ),
  q(
    "Funções Inorgânicas e Reações Químicas",
    "Estequiometria de neutralização",
    "medio",
    R`Determine o volume de solução de $\text{NaOH}$ $0{,}10$ mol/L necessário para neutralizar completamente $50$ mL de solução de $\text{HCl}$ $0{,}20$ mol/L.`,
    { a: R`$25$ mL`, b: R`$50$ mL`, c: R`$10$ mL`, d: R`$200$ mL`, e: R`$100$ mL` },
    "e",
    R`A reação é $\text{HCl}+\text{NaOH}\rightarrow\text{NaCl}+\text{H}_2\text{O}$, na proporção $1:1$. O ácido fornece $n=0{,}050\times 0{,}20=0{,}010$ mol. É preciso a mesma quantidade de base: $V=\dfrac{0{,}010}{0{,}10}=0{,}10$ L $=100$ mL.`
  ),
  q(
    "Funções Inorgânicas e Reações Químicas",
    "Estequiometria na produção de cal",
    "medio",
    R`Na hidratação da cal virgem, $\text{CaO}+\text{H}_2\text{O}\rightarrow\text{Ca(OH)}_2$, determine a massa de cal hidratada obtida a partir de $56$ g de $\text{CaO}$. Massas molares: $\text{Ca}=40$, $\text{O}=16$, $\text{H}=1$ g/mol.`,
    { a: R`$56$ g`, b: R`$74$ g`, c: R`$100$ g`, d: R`$40$ g`, e: R`$130$ g` },
    "b",
    R`A massa molar do $\text{CaO}$ é $40+16=56$ g/mol, então $56$ g correspondem a $1{,}0$ mol. A proporção é $1:1$, logo forma-se $1{,}0$ mol de $\text{Ca(OH)}_2$, cuja massa molar é $40+2(16+1)=74$ g/mol. A massa obtida é $74$ g.`
  ),
  q(
    "Funções Inorgânicas e Reações Químicas",
    "Célula a combustível",
    "medio",
    R`Em uma célula a combustível de hidrogênio e oxigênio, que produz apenas água, o hidrogênio atua como:`,
    {
      a: R`agente oxidante`,
      b: R`catalisador da reação`,
      c: R`eletrólito da célula`,
      d: R`agente redutor`,
      e: R`produto formado no cátodo`,
    },
    "d",
    R`No ânodo ocorre $\text{H}_2\rightarrow 2\text{H}^++2e^-$: o hidrogênio perde elétrons, ou seja, é oxidado, e portanto atua como agente redutor — quem se reduz é o oxigênio, o agente oxidante. É essa separação espacial das semirreações que permite extrair trabalho elétrico em vez de calor.`
  ),
  q(
    "Funções Inorgânicas e Reações Químicas",
    "Resistência à corrosão em ligas",
    "medio",
    R`O aço inoxidável resiste à corrosão atmosférica muito melhor que o aço-carbono comum graças à formação, pelo cromo, de:`,
    {
      a: R`camada passivante de óxido`,
      b: R`liga intersticial com carbono`,
      c: R`ligação iônica com o ferro`,
      d: R`revestimento externo de zinco`,
      e: R`filme polimérico protetor`,
    },
    "a",
    R`Acima de cerca de $11\%$ de cromo, o metal reage com o oxigênio do ar formando um filme finíssimo e aderente de $\text{Cr}_2\text{O}_3$, que isola o metal do meio e se regenera se for arranhado. Esse fenômeno chama-se passivação. O revestimento de zinco caracteriza a galvanização, técnica diferente.`
  ),
  q(
    "Funções Inorgânicas e Reações Químicas",
    "Proteção catódica",
    "medio",
    R`Na proteção catódica de uma estrutura de ferro por meio de blocos de zinco a ela conectados, o zinco atua como:`,
    {
      a: R`cátodo protetor`,
      b: R`eletrólito do meio`,
      c: R`ânodo de sacrifício`,
      d: R`isolante elétrico`,
      e: R`catalisador da corrosão`,
    },
    "c",
    R`O zinco tem potencial de redução menor que o do ferro ($-0{,}76$ V contra $-0{,}44$ V), portanto oxida-se preferencialmente. Ele funciona como ânodo e é consumido ao longo do tempo — daí o nome ânodo de sacrifício — enquanto força o ferro a permanecer como cátodo, protegido da oxidação. É a técnica usada em cascos de navios e tubulações enterradas.`
  ),
];

const aqui = dirname(fileURLToPath(import.meta.url));
const saida = resolve(aqui, "..", "quimica_geral_lote2.json");
mkdirSync(dirname(saida), { recursive: true });
writeFileSync(saida, JSON.stringify(questoes, null, 2), "utf8");
console.log(`${questoes.length} questoes escritas em ${saida}`);
