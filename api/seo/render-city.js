// Endpoint SSR para SEO (Server-Side Rendering Meta Tags Dinâmicas)
const fs = require('fs');
const path = require('path');

export default async function handler(req, res) {
    const { state, city } = req.query;

    if (!state || !city) {
        return res.status(400).send('Parâmetros de estado ou cidade ausentes');
    }

    // Capitalizar primeira letra corretamente tratando hifens
    const formatUrlParam = (param) => {
        return param
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    const cityName = formatUrlParam(city);
    const stateName = state.toUpperCase(); // sigla do estado, ex: SP 

    try {
        // Tentar ler o index.html local armazenado no build da Vercel
        const indexPath = path.join(process.cwd(), 'index.html');
        let htmlData = fs.readFileSync(indexPath, 'utf8');

        // Textos Dinâmicos Baseados no Foco do Sistema
        const dynamicTitle = `Acompanhantes em ${cityName} - ${stateName} | DesejosMS`;
        const dynamicDesc = `Encontre acompanhantes em ${cityName}, ${stateName}. Perfis reais com fotos, vídeos e WhatsApp. As melhores acompanhantes de luxo e massagistas da região.`;
        const dynamicKeywords = `acompanhantes ${cityName.toLowerCase()}, acompanhante ${cityName.toLowerCase()}, garotas de programa ${cityName.toLowerCase()}, massagistas ${cityName.toLowerCase()}`;

        // Substituição do Título Principal
        htmlData = htmlData.replace(
            /<title>(.*?)<\/title>/g, 
            `<title>${dynamicTitle}</title>`
        );

        // Injeção de Meta Tags Poderosas Próximas ao Fechamento do Head
        const metaTagsToInject = `
            <meta name="description" content="${dynamicDesc}">
            <meta name="keywords" content="${dynamicKeywords}">
            <meta property="og:title" content="${dynamicTitle}">
            <meta property="og:description" content="${dynamicDesc}">
            <meta property="og:type" content="website">
            <meta property="og:url" content="https://desejosms.com.br/acompanhantes-${state.toLowerCase()}/${city.toLowerCase()}">
            <meta name="twitter:card" content="summary_large_image">
            <meta name="twitter:title" content="${dynamicTitle}">
            <meta name="twitter:description" content="${dynamicDesc}">
            <link rel="canonical" href="https://desejosms.com.br/acompanhantes-${state.toLowerCase()}/${city.toLowerCase()}">
            <!-- Automação SEO Vercel Injetada -->
        `;

        htmlData = htmlData.replace('</head>', `${metaTagsToInject}\n</head>`);

        // Adicionar um mini-script para fazer o front-end "Spa" já abrir filtrando essa cidade nativamente
        const initScript = `
        <script>
            window.AUTOMATIC_SEO_CITY = "${cityName}";
            window.AUTOMATIC_SEO_STATE = "${stateName}";
            
            // Opcional: injetar de imediato para caso o index.js demore
            document.addEventListener("DOMContentLoaded", () => {
                const searchInput = document.querySelector('.search-input');
                if (searchInput) {
                    searchInput.value = "${cityName}";
                    // Opcional: forçar disparo do evento de filtro da cidade aqui dependendo da sua logica front
                }
            });
        </script>
        `;
        htmlData = htmlData.replace('</body>', `${initScript}\n</body>`);

        // Retorna o HTML Renderizado com força pro Robô do Google
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=3600'); // Cache na Vercel CDN por 1 dia
        return res.status(200).send(htmlData);

    } catch (err) {
        console.error('Erro ao renderizar HTML com SEO', err);
        // Fallback: Redireciona com segurança ou reescreve local
        return res.redirect('/');
    }
}
