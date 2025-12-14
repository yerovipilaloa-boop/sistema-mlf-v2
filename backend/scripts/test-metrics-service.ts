
import { PrismaClient } from '@prisma/client';
import metricasService from '../src/services/metricas.service';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Testing Metricas Service...');
    try {
        const metricas = await metricasService.obtenerMetricasCompletas();
        console.log('✅ Metricas obtained successfully:');
        console.log(JSON.stringify(metricas, null, 2));
    } catch (error) {
        console.error('❌ Error testing metricas:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
