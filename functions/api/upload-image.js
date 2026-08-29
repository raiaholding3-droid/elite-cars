export async function onRequestPost(context) {

    try {

        const formData =
            await context.request.formData();

        const file =
            formData.get("image");

        const carId =
            formData.get("carId");


        if (!file) {

            return Response.json(
                {
                    success: false,
                    message: "لم يتم اختيار صورة"
                },
                {
                    status: 400
                }
            );

        }


        if (!carId) {

            return Response.json(
                {
                    success: false,
                    message: "رقم السيارة غير موجود"
                },
                {
                    status: 400
                }
            );

        }


        // السماح بالصور فقط

        if (
            !file.type ||
            !file.type.startsWith("image/")
        ) {

            return Response.json(
                {
                    success: false,
                    message: "الملف المختار ليس صورة"
                },
                {
                    status: 400
                }
            );

        }


        // حد أقصى 8 MB للصورة

        if (
            file.size >
            8 * 1024 * 1024
        ) {

            return Response.json(
                {
                    success: false,
                    message: "حجم الصورة أكبر من 8MB"
                },
                {
                    status: 400
                }
            );

        }


        const extension =
            file.name.includes(".")
                ? file.name
                    .split(".")
                    .pop()
                    .toLowerCase()
                : "jpg";


        const randomPart =
            crypto.randomUUID();


        const key =
            `cars/${carId}/${Date.now()}-${randomPart}.${extension}`;


        await context.env.IMAGES.put(
            key,
            file.stream(),
            {
                httpMetadata: {
                    contentType:
                        file.type
                }
            }
        );


        return Response.json(
            {
                success: true,
                key: key,
                image_url:
                    `/api/image?key=${encodeURIComponent(key)}`
            },
            {
                status: 201
            }
        );

    }

    catch (error) {

        console.error(error);

        return Response.json(
            {
                success: false,
                message:
                    error.message ||
                    "حدث خطأ أثناء رفع الصورة"
            },
            {
                status: 500
            }
        );

    }

}
