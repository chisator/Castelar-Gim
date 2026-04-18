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
                src: "/logo.webp",
                sizes: "192x192",
                type: "image/webp",
            },
            {
                src: "/logo.webp",
                sizes: "512x512",
                type: "image/webp",
            },
        ],
    };
}
