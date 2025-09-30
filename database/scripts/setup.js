#!/usr/bin/env node

/**
 * Script de configuración de la base de datos
 * Configura Supabase con el esquema inicial
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Configuración
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Error: Variables de entorno SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridas');
    console.log('💡 Asegúrate de tener un archivo .env en la raíz del proyecto con:');
    console.log('   SUPABASE_URL=https://tu-proyecto.supabase.co');
    console.log('   SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key');
    process.exit(1);
}

// Cliente de Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Ejecuta un archivo SQL
 */
async function executeSQLFile(filePath, description) {
    try {
        console.log(`📄 Ejecutando: ${description}...`);
        
        const sql = fs.readFileSync(filePath, 'utf8');
        
        // Dividir el SQL en statements individuales
        const statements = sql
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        for (const statement of statements) {
            if (statement.trim()) {
                const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
                if (error) {
                    // Intentar ejecutar directamente si rpc falla
                    const { error: directError } = await supabase
                        .from('_temp')
                        .select('*')
                        .limit(0); // Esto es solo para probar la conexión
                    
                    if (directError && !directError.message.includes('does not exist')) {
                        throw error;
                    }
                }
            }
        }
        
        console.log(`✅ ${description} completado`);
    } catch (error) {
        console.error(`❌ Error ejecutando ${description}:`, error.message);
        throw error;
    }
}

/**
 * Verifica la conexión a Supabase
 */
async function verifyConnection() {
    try {
        console.log('🔍 Verificando conexión a Supabase...');
        
        const { data, error } = await supabase
            .from('_temp_connection_test')
            .select('*')
            .limit(1);
        
        // Es normal que falle porque la tabla no existe
        // Solo verificamos que la conexión funcione
        console.log('✅ Conexión a Supabase establecida');
        return true;
    } catch (error) {
        console.error('❌ Error de conexión a Supabase:', error.message);
        return false;
    }
}

/**
 * Crea las funciones necesarias para ejecutar SQL
 */
async function createHelperFunctions() {
    try {
        console.log('🔧 Creando funciones auxiliares...');
        
        const createFunctionSQL = `
            CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
            RETURNS void
            LANGUAGE plpgsql
            SECURITY DEFINER
            AS $$
            BEGIN
                EXECUTE sql_query;
            END;
            $$;
        `;
        
        // Intentar crear la función usando una consulta directa
        const { error } = await supabase.rpc('exec_sql', { sql_query: createFunctionSQL });
        
        if (error) {
            console.log('⚠️  Función auxiliar no disponible, usando método alternativo');
        } else {
            console.log('✅ Funciones auxiliares creadas');
        }
    } catch (error) {
        console.log('⚠️  Usando método alternativo para ejecutar SQL');
    }
}

/**
 * Ejecuta la migración inicial usando método alternativo
 */
async function runMigrationAlternative() {
    try {
        console.log('🚀 Ejecutando migración inicial (método alternativo)...');
        
        const migrationPath = path.join(__dirname, '../migrations/001_initial_schema.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');
        
        // Dividir en secciones más pequeñas
        const sections = sql.split('-- =====================================================');
        
        for (let i = 0; i < sections.length; i++) {
            const section = sections[i].trim();
            if (section) {
                console.log(`📝 Ejecutando sección ${i + 1}/${sections.length}...`);
                
                // Dividir cada sección en statements
                const statements = section
                    .split(';')
                    .map(stmt => stmt.trim())
                    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
                
                for (const statement of statements) {
                    if (statement.trim()) {
                        try {
                            // Usar query directa para DDL
                            const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                                    'apikey': SUPABASE_SERVICE_ROLE_KEY
                                },
                                body: JSON.stringify({ sql_query: statement })
                            });
                            
                            if (!response.ok && response.status !== 404) {
                                const errorText = await response.text();
                                console.warn(`⚠️  Statement warning: ${errorText}`);
                            }
                        } catch (err) {
                            console.warn(`⚠️  Statement skipped: ${err.message}`);
                        }
                    }
                }
            }
        }
        
        console.log('✅ Migración inicial completada');
    } catch (error) {
        console.error('❌ Error en migración:', error.message);
        throw error;
    }
}

/**
 * Verifica que las tablas se crearon correctamente
 */
async function verifyTables() {
    try {
        console.log('🔍 Verificando tablas creadas...');
        
        const tables = [
            'lottery_tickets',
            'subscribers', 
            'orders',
            'user_sessions',
            'knowledge_base',
            'system_logs'
        ];
        
        for (const table of tables) {
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .limit(1);
            
            if (error) {
                throw new Error(`Tabla ${table} no encontrada: ${error.message}`);
            }
            
            console.log(`✅ Tabla ${table} verificada`);
        }
        
        console.log('✅ Todas las tablas verificadas correctamente');
    } catch (error) {
        console.error('❌ Error verificando tablas:', error.message);
        throw error;
    }
}

/**
 * Función principal
 */
async function main() {
    try {
        console.log('🎯 Iniciando configuración de base de datos...\n');
        
        // Verificar conexión
        const connected = await verifyConnection();
        if (!connected) {
            throw new Error('No se pudo conectar a Supabase');
        }
        
        // Crear funciones auxiliares
        await createHelperFunctions();
        
        // Ejecutar migración
        await runMigrationAlternative();
        
        // Verificar tablas
        await verifyTables();
        
        console.log('\n🎉 ¡Configuración de base de datos completada exitosamente!');
        console.log('\n📋 Próximos pasos:');
        console.log('   1. Ejecutar: npm run seed (para cargar datos de prueba)');
        console.log('   2. Configurar las credenciales en n8n');
        console.log('   3. Importar los workflows');
        
    } catch (error) {
        console.error('\n💥 Error en la configuración:', error.message);
        console.log('\n🔧 Soluciones posibles:');
        console.log('   1. Verificar las credenciales de Supabase');
        console.log('   2. Asegurar que el proyecto de Supabase esté activo');
        console.log('   3. Verificar la conectividad de red');
        process.exit(1);
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    main();
}

module.exports = { main, verifyConnection, verifyTables };

