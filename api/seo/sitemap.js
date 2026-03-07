// Endpoint SSR para gerar Sitemap.xml Dinâmico baseado nas cidades ativas
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

export default async function handler(req, res) {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
        return res.status(500).send('Erro: Supabase não configurado');
    }

    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

        // Buscar todos os anúncios ativos
        const { data: ads, error } = await supabase
            .from('announcements')
            .select('state, city, updated_at')
            .eq('status', 'active');

        if (error) throw error;

        // Criar um Set de rotas únicas (Estado + Cidade)
        const routes = new Map();
        
        ads.forEach(ad => {
            if (ad.state && ad.city) {
                // ex: acompanhantes-sp/sao-paulo
                const stateParam = ad.state.toLowerCase().trim();
                const cityParam = ad.city.toLowerCase().trim().replace(/\s+/g, '-');
                
                const urlPath = `acompanhantes-${stateParam}/${cityParam}`;
                
                // Mantenha sempre a data de atualização mais recente para aquela cidade
                const lastMod = new Date(ad.updated_at).toISOString().split('T')[0];
                
                if (!routes.has(urlPath) || routes.get(urlPath) < lastMod) {
                    routes.set(urlPath, lastMod);
                }
            }
        });

        const baseUrl = process.env.SITE_URL || 'https://desejosms.vercel.app'; // Troque para seu site em prod

        // Início do XML
        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

        // Raiz do site
        xml += `  <url>\n`;
        xml += `    <loc>${baseUrl}/</loc>\n`;
        xml += `    <changefreq>daily</changefreq>\n`;
        xml += `    <priority>1.0</priority>\n`;
        xml += `  </url>\n`;

        // Raízes de cidades ativas
        for (const [urlPath, lastMod] of routes.entries()) {
            xml += `  <url>\n`;
            xml += `    <loc>${baseUrl}/${urlPath}</loc>\n`;
            xml += `    <lastmod>${lastMod}</lastmod>\n`;
            xml += `    <changefreq>hourly</changefreq>\n`;
            xml += `    <priority>0.9</priority>\n`;
            xml += `  </url>\n`;
        }

        xml += `</urlset>`;

        // Instruir Vercel a fazer cache do XML (Edge Cache)
        res.setHeader('Content-Type', 'text/xml');
        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate'); // 1h de cache
        return res.status(200).send(xml);

    } catch (err) {
        console.error('Erro ao gerar sitemap:', err);
        return res.status(500).send('Erro ao montar sitemap XML');
    }
}
