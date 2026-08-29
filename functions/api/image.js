export async function onRequestGet(context) {

    try {

        const url =
            new URL(
                context.request.url
            );


        const key =
            url.searchParams.get(
                "key"
            );


        if (!key) {

            return new Response(
                "Image key is required",
                {
                    status: 400
                }
            );

        }


        const object =
            await context.env.IMAGES.get(
                key
            );


        if (!object) {

            return new Response(
                "Image not found",
                {
                    status: 404
                }
            );

        }


        const headers =
            new Headers();


        object.writeHttpMetadata(
            headers
        );


        headers.set(
            "etag",
            object.httpEtag
        );


        headers.set(
            "Cache-Control",
            "public, max-age=31536000"
        );


        return new Response(
            object.body,
            {
                headers
            }
        );

    }

    catch (error) {

        console.error(error);

        return new Response(
            "حدث خطأ أثناء تحميل الصورة",
            {
                status: 500
            }
        );

    }

}
