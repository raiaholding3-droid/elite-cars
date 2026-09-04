export async function onRequestPost(context) {

    try {

        const formData =
            await context.request.formData();


        const file =
            formData.get("image");


        const carId =
            formData.get("carId");


        const imageOrder =
            Number(
                formData.get("imageOrder") || 0
            );
        const isMain =
    formData.get("isMain") === "1"
        ? 1
        : 0;


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


        // الحد الأقصى للصورة الواحدة 8MB

        if (
            file.size >
            8 * 1024 * 1024
        ) {

            return Response.json(
                {
                    success: false,
                    message:
                        "حجم الصورة أكبر من 8MB"
                },
                {
                    status: 400
                }
            );

        }


        // =====================================
        // إنشاء اسم فريد للصورة
        // =====================================

        let extension = "jpg";


        if (
            file.name &&
            file.name.includes(".")
        ) {

            extension =
                file.name
                    .split(".")
                    .pop()
                    .toLowerCase();

        }


        const key =
            `cars/${carId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;


        // =====================================
        // رفع الصورة إلى R2
        // =====================================

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


        // رابط الصورة داخل موقعنا

        const imageUrl =
            `/api/image?key=${encodeURIComponent(key)}`;


        // =====================================
        // تسجيل الصورة في D1
        // =====================================

        await context.env.DB
            .prepare(`
                INSERT INTO car_images
                (
                    car_id,
                    image_url,
                    image_order,
                    is_main
                )

                VALUES (?, ?, ?, ?)
            `)
            .bind(
                Number(carId),
                imageUrl,
                imageOrder,
                isMain
            )
            .run();


        // =====================================
        // إذا كانت الأولى نجعلها الرئيسية
        // =====================================

        if (isMain === 1) {

            await context.env.DB
                .prepare(`
                    UPDATE cars

                    SET
                        main_image = ?,
                        updated_at = CURRENT_TIMESTAMP

                    WHERE id = ?
                `)
                .bind(
                    imageUrl,
                    Number(carId)
                )
                .run();

        }


        return Response.json(
            {
                success: true,

                image_url:
                    imageUrl,

                key:
                    key,

                image_order:
                    imageOrder,

                is_main:
                    isMain
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
