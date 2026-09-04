export async function onRequestGet(context) {

    try {

        const { results: cars } =
            await context.env.DB
                .prepare(`
                    SELECT *
                    FROM cars
                    ORDER BY id DESC
                `)
                .all();


        // جلب صور كل سيارة
        for (const car of cars) {

            const { results: images } =
                await context.env.DB
                    .prepare(`
                        SELECT
                            id,
                            image_url,
                            image_order,
                            is_main
                        FROM car_images
                        WHERE car_id = ?
                        ORDER BY image_order ASC
                    `)
                    .bind(car.id)
                    .all();


            car.images =
                images.map(
                    function(image) {

                        return image.image_url;

                    }
                );

        }


        return Response.json({
            success: true,
            cars: cars
        });

    }

    catch (error) {

        console.error(error);


        return Response.json(
            {
                success: false,
                message:
                    error.message ||
                    "حدث خطأ أثناء جلب السيارات"
            },
            {
                status: 500
            }
        );

    }

}


export async function onRequestPost(context) {
    try {
        const data = await context.request.json();

        if (
            !data.name ||
            !data.brand ||
            !data.model ||
            !data.year ||
            !data.price
        ) {
            return Response.json({
                success: false,
                message: "البيانات الأساسية غير مكتملة"
            }, { status: 400 });
        }

        const result = await context.env.DB
            .prepare(`
                INSERT INTO cars (
                    name,
                    brand,
                    model,
                    year,
                    vin,
                    mileage,
                    color,
                    fuel_type,
                    body_type,
                    engine,
                    transmission,
                    price,
                    status,
                    description,
                    main_image
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `)
            .bind(
                data.name,
                data.brand,
                data.model,
                Number(data.year),
                data.vin || null,
                data.mileage || null,
                data.color || null,
                data.fuel_type || null,
                data.body_type || null,
                data.engine || null,
                data.transmission || null,
                Number(data.price),
                data.status || "متوفرة",
                data.description || null,
                data.main_image || null
            )
            .run();

        return Response.json({
            success: true,
            message: "تمت إضافة السيارة بنجاح",
            id: result.meta.last_row_id
        }, { status: 201 });

    } catch (error) {
        return Response.json({
            success: false,
            message: error.message
        }, { status: 500 });
    }
}
// ==========================================
// حذف سيارة
// DELETE /api/cars?id=123
// ==========================================

export async function onRequestDelete(context) {

    try {

        const url =
            new URL(
                context.request.url
            );


        const carId =
            url.searchParams.get("id");


        if (!carId) {

            return Response.json(
                {
                    success: false,
                    message:
                        "رقم السيارة غير موجود"
                },
                {
                    status: 400
                }
            );

        }


        // =====================================
        // التأكد أن السيارة موجودة
        // =====================================

        const car =
            await context.env.DB
                .prepare(`
                    SELECT id
                    FROM cars
                    WHERE id = ?
                `)
                .bind(
                    Number(carId)
                )
                .first();


        if (!car) {

            return Response.json(
                {
                    success: false,
                    message:
                        "السيارة غير موجودة"
                },
                {
                    status: 404
                }
            );

        }


        // =====================================
        // جلب صور السيارة قبل حذفها
        // =====================================

        const { results: images } =
            await context.env.DB
                .prepare(`
                    SELECT image_url
                    FROM car_images
                    WHERE car_id = ?
                `)
                .bind(
                    Number(carId)
                )
                .all();


        // =====================================
        // حذف الصور من R2
        // =====================================

        for (const image of images) {

            try {

                const imageUrl =
                    new URL(
                        image.image_url,
                        context.request.url
                    );


                const key =
                    imageUrl
                        .searchParams
                        .get("key");


                if (key) {

                    await context.env.IMAGES
                        .delete(key);

                }

            }

            catch (imageError) {

                console.error(
                    "خطأ أثناء حذف صورة:",
                    imageError
                );

            }

        }


        // =====================================
        // حذف سجلات الصور من D1
        // =====================================

        await context.env.DB
            .prepare(`
                DELETE FROM car_images
                WHERE car_id = ?
            `)
            .bind(
                Number(carId)
            )
            .run();


        // =====================================
        // حذف السيارة من D1
        // =====================================

        await context.env.DB
            .prepare(`
                DELETE FROM cars
                WHERE id = ?
            `)
            .bind(
                Number(carId)
            )
            .run();


        return Response.json({
            success: true,
            message:
                "تم حذف السيارة بنجاح"
        });

    }

    catch (error) {

        console.error(error);


        return Response.json(
            {
                success: false,
                message:
                    error.message ||
                    "حدث خطأ أثناء حذف السيارة"
            },
            {
                status: 500
            }
        );

    }

}
