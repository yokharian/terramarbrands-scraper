export interface Input {
    startUrls: {
        url: string;
        method?: string;
        headers?: Record<string, string>;
        userData: Record<string, unknown>;
    }[];
    maxRequestsPerCrawl: number;
}

export interface RawApiProduct {
    id: string;
    clave: string;
    producto: string;
    precio: string;
    descripcion: string;
    aplicacion: string;
    ingredientes: string;
    familiaOlfativa: string;
    perfumista: string;
    link: string;
    departamento: string;
    subdepartamento: string;
    marca: string;
    clase: string;
    imagen: string;
    carrusel: string;
}

export interface RawApiDepartment {
    depto: string;
    nombre: string;
    menu: string;
    secciones: RawApiSubDepartment[];
}

export interface RawApiSubDepartment {
    subdepto: string;
    nombre: string;
}

export interface DepartmentInfo {
    name: string;
    subdepartments: Record<string, string>;
}

export type DepartmentLookup = Record<string, DepartmentInfo>;

export interface ProductItem {
    sku: string;
    name: string;
    price: number;
    currency: string;
    departmentId: string;
    department: string;
    subdepartmentId: string;
    subdepartment: string;
    description: string;
    application: string;
    ingredients: string;
    olfactiveFamily: string;
    imageUrls: string[];
    hasCarousel: boolean;
    variantClass: string;
    url: string;
}