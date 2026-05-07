import { log } from 'apify';

import type { DepartmentInfo,DepartmentLookup, RawApiDepartment, RawApiProduct } from './types.js';

const API_BASE = 'https://terramarbrands.mx/wsTerramarV2/Service1.svc';

export async function fetchDepartments(): Promise<RawApiDepartment[]> {
    const url = `${API_BASE}/getDeptos`;
    log.info('Fetching departments', { url });
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch departments: ${response.status} ${response.statusText}`);
    }
    const data = await response.json() as RawApiDepartment[];
    log.info(`Fetched ${data.length} department entries`);
    return data;
}

export async function fetchProducts(depto?: string | number, clave?: string): Promise<RawApiProduct[]> {
    let url = `${API_BASE}/getDescripciones?depto=${depto ?? 0}`;
    if (clave) {
        url += `&clave=${encodeURIComponent(clave)}`;
    }
    log.info('Fetching products', { url });
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`);
    }
    const data = await response.json() as RawApiProduct[];
    log.info(`Fetched ${data.length} products`);
    return data;
}

export function buildDepartmentLookup(departments: RawApiDepartment[]): DepartmentLookup {
    const lookup: DepartmentLookup = {};
    for (const dept of departments) {
        if (dept.menu !== '3') continue;
        const subDepts: Record<string, string> = {};
        for (const sub of dept.secciones) {
            subDepts[sub.subdepto] = sub.nombre;
        }
        lookup[dept.depto] = {
            name: dept.nombre,
            subdepartments: subDepts,
        } satisfies DepartmentInfo;
    }
    return lookup;
}

export function resolveDepartmentName(lookup: DepartmentLookup, deptId: string): string {
    return lookup[deptId]?.name ?? '';
}

export function resolveSubDepartmentName(lookup: DepartmentLookup, deptId: string, subDeptId: string): string {
    return lookup[deptId]?.subdepartments?.[subDeptId] ?? '';
}