import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "Castelar Gimnasio",
        short_name: "Castelar Gim",
        description: "Aplicación oficial de Castelar Gimnasio",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#059669",
        icons: [
            {
                src: "/Layer1000.svg",
                sizes: "192x192",
                type: "image/svg+xml",
            },
            {
                src: "/Layer1000.svg",
                sizes: "512x512",
                type: "image/svg+xml",
            },
        ],
    };
}
