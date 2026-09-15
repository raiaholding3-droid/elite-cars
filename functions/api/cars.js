import {
    requirePermission,
    logAdminActivity
} from "../_lib/admin-auth.js";
// ==========================================
// API إدارة سيارات المعرض
// /api/cars
// ==========================================


// ==========================================
// GET
// جلب جميع السيارات مع الصور
// ==========================================

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


        // ======================================
        // جلب صور كل سيارة
        // ======================================

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


            // معلومات الصور كاملة
            // سنحتاجها لاحقًا عند تعديل الصور

            car.image_records =
                images;

        }


        return Response.json({
            success: true,
            cars: cars
        });

    }

    catch (error) {

        console.error(
            "GET /api/cars:",
            error
        );


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



// ==========================================
// POST
// إضافة سيارة جديدة
// ==========================================

export async function onRequestPost(context) {

    try {
        // =====================================
// التحقق من صلاحية إضافة سيارة
// =====================================

const permissionCheck =
    await requirePermission(
        context,
        "cars_add"
    );

if (!permissionCheck.ok) {
    return permissionCheck.response;
}

const adminAuth =
    permissionCheck.auth;

        const data =
            await context.request.json();


        // ======================================
        // التحقق من البيانات الأساسية
        // ======================================

        if (
            !data.name ||
            !data.brand ||
            !data.model ||
            !data.year ||
            data.price === undefined ||
            data.price === null ||
            data.price === ""
        ) {

            return Response.json(
                {
                    success: false,
                    message:
                        "البيانات الأساسية غير مكتملة"
                },
                {
                    status: 400
                }
            );

        }


        // ======================================
        // إضافة السيارة
        // ======================================

        const result =
            await context.env.DB
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
                    VALUES (
                        ?, ?, ?, ?, ?, ?,
                        ?, ?, ?, ?, ?, ?,
                        ?, ?, ?
                    )
                `)
                .bind(
                    data.name,
                    data.brand,
                    data.model,
                    Number(data.year),
                    data.vin || null,
                    data.mileage !== undefined &&
                    data.mileage !== null &&
                    data.mileage !== ""
                        ? Number(data.mileage)
                        : null,
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


        return Response.json(
            {
                success: true,
                message:
                    "تمت إضافة السيارة بنجاح",
                id:
                    result.meta.last_row_id
            },
            {
                status: 201
            }
        );

    }

    catch (error) {

        console.error(
            "POST /api/cars:",
            error
        );


        return Response.json(
            {
                success: false,
                message:
                    error.message ||
                    "حدث خطأ أثناء إضافة السيارة"
            },
            {
                status: 500
            }
        );

    }

}



// ==========================================
// PUT
// تعديل بيانات سيارة كاملة
// + تحديث الصورة الرئيسية
// ==========================================

export async function onRequestPut(context) {

    try {

        // =====================================
        // التحقق من صلاحية تعديل السيارة
        // =====================================

        const permissionCheck =
            await requirePermission(
                context,
                "cars_edit"
            );

        if (!permissionCheck.ok) {
            return permissionCheck.response;
        }

        const adminAuth =
            permissionCheck.auth;


        // =====================================
        // قراءة البيانات
        // =====================================

        const data =
            await context.request.json();


        // =====================================
        // التأكد من وجود ID
        // =====================================

        if (!data.id) {

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


        const carId =
            Number(data.id);


        if (
            !Number.isInteger(carId) ||
            carId <= 0
        ) {

            return Response.json(
                {
                    success: false,
                    message: "رقم السيارة غير صحيح"
                },
                {
                    status: 400
                }
            );

        }


        // =====================================
        // التأكد من وجود السيارة
        // =====================================

        const existingCar =
            await context.env.DB
                .prepare(`
                    SELECT *
                    FROM cars
                    WHERE id = ?
                `)
                .bind(carId)
                .first();


        if (!existingCar) {

            return Response.json(
                {
                    success: false,
                    message: "السيارة غير موجودة"
                },
                {
                    status: 404
                }
            );

        }


        // =====================================
        // التحقق من البيانات الأساسية
        // =====================================

        if (
            !data.name ||
            !data.brand ||
            !data.model ||
            !data.year ||
            data.price === undefined ||
            data.price === null ||
            data.price === ""
        ) {

            return Response.json(
                {
                    success: false,
                    message: "البيانات الأساسية غير مكتملة"
                },
                {
                    status: 400
                }
            );

        }


        // =====================================
        // التحقق من الحالة
        // =====================================

        const allowedStatuses = [
            "متوفرة",
            "في الطريق",
            "محجوزة",
            "مباعة"
        ];


        const status =
            data.status ||
            existingCar.status ||
            "متوفرة";


        if (
            !allowedStatuses.includes(status)
        ) {

            return Response.json(
                {
                    success: false,
                    message: "حالة السيارة غير صحيحة"
                },
                {
                    status: 400
                }
            );

        }


        // =====================================
        // تحديد الصورة الرئيسية
        // =====================================

        let mainImage =
            existingCar.main_image;


        if (
            data.main_image !== undefined
        ) {

            if (
                data.main_image === null ||
                data.main_image === ""
            ) {

                mainImage = null;

            }

            else {

                // نتأكد أن الصورة المختارة
                // تخص هذه السيارة فعلًا

                const selectedImage =
                    await context.env.DB
                        .prepare(`
                            SELECT
                                id,
                                image_url
                            FROM car_images
                            WHERE
                                car_id = ?
                                AND image_url = ?
                            LIMIT 1
                        `)
                        .bind(
                            carId,
                            data.main_image
                        )
                        .first();


                if (!selectedImage) {

                    return Response.json(
                        {
                            success: false,
                            message:
                                "الصورة الرئيسية المختارة لا تخص هذه السيارة"
                        },
                        {
                            status: 400
                        }
                    );

                }


                mainImage =
                    selectedImage.image_url;

            }

        }


        // =====================================
        // تحديث بيانات السيارة
        // =====================================

        await context.env.DB
            .prepare(`
                UPDATE cars

                SET
                    name = ?,
                    brand = ?,
                    model = ?,
                    year = ?,
                    vin = ?,
                    mileage = ?,
                    color = ?,
                    fuel_type = ?,
                    body_type = ?,
                    engine = ?,
                    transmission = ?,
                    price = ?,
                    status = ?,
                    description = ?,
                    main_image = ?,
                    updated_at = CURRENT_TIMESTAMP

                WHERE id = ?
            `)
            .bind(
                data.name,
                data.brand,
                data.model,
                Number(data.year),

                data.vin !== undefined
                    ? data.vin || null
                    : existingCar.vin,

                data.mileage !== undefined
                    ? (
                        data.mileage === "" ||
                        data.mileage === null
                            ? null
                            : Number(data.mileage)
                    )
                    : existingCar.mileage,

                data.color !== undefined
                    ? data.color || null
                    : existingCar.color,

                data.fuel_type !== undefined
                    ? data.fuel_type || null
                    : existingCar.fuel_type,

                data.body_type !== undefined
                    ? data.body_type || null
                    : existingCar.body_type,

                data.engine !== undefined
                    ? data.engine || null
                    : existingCar.engine,

                data.transmission !== undefined
                    ? data.transmission || null
                    : existingCar.transmission,

                Number(data.price),

                status,

                data.description !== undefined
                    ? data.description || null
                    : existingCar.description,

                mainImage,

                carId
            )
            .run();


        // =====================================
        // مزامنة is_main في جدول الصور
        // =====================================

        if (
            data.main_image !== undefined
        ) {

            // أولًا نلغي الرئيسية عن جميع الصور

            await context.env.DB
                .prepare(`
                    UPDATE car_images
                    SET is_main = 0
                    WHERE car_id = ?
                `)
                .bind(carId)
                .run();


            // ثم نحدد الصورة المختارة كرئيسية

            if (mainImage) {

                await context.env.DB
                    .prepare(`
                        UPDATE car_images
                        SET is_main = 1
                        WHERE
                            car_id = ?
                            AND image_url = ?
                    `)
                    .bind(
                        carId,
                        mainImage
                    )
                    .run();

            }

        }


        // =====================================
        // تسجيل النشاط
        // =====================================

        try {

            await logAdminActivity(
                context,
                adminAuth.user.id,
                "car_updated",
                "car",
                carId,
                {
                    name: data.name,
                    main_image: mainImage
                }
            );

        }

        catch (logError) {

            console.error(
                "خطأ تسجيل نشاط تعديل السيارة:",
                logError
            );

        }


        // =====================================
        // نجاح
        // =====================================

        return Response.json(
            {
                success: true,

                message:
                    "تم حفظ تعديلات السيارة بنجاح",

                id:
                    carId,

                main_image:
                    mainImage
            }
        );

    }

    catch (error) {

        console.error(
            "PUT /api/cars:",
            error
        );


        return Response.json(
            {
                success: false,

                message:
                    error.message ||
                    "حدث خطأ أثناء تعديل السيارة"
            },
            {
                status: 500
            }
        );

    }

}


// ==========================================
// PATCH
// تغيير حالة السيارة فقط
//
// يتم إرسال:
// {
//     id: 1,
//     status: "مباعة"
// }
// ==========================================

export async function onRequestPatch(context) {

    try {
        // =====================================
// التحقق من صلاحية تغيير حالة السيارة
// =====================================

const permissionCheck =
    await requirePermission(
        context,
        "cars_change_status"
    );

if (!permissionCheck.ok) {
    return permissionCheck.response;
}

const adminAuth =
    permissionCheck.auth;

        const data =
            await context.request.json();


        // ======================================
        // التحقق من ID
        // ======================================

        if (!data.id) {

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


        const carId =
            Number(data.id);


        if (
            !Number.isInteger(carId) ||
            carId <= 0
        ) {

            return Response.json(
                {
                    success: false,
                    message:
                        "رقم السيارة غير صحيح"
                },
                {
                    status: 400
                }
            );

        }


        // ======================================
        // التحقق من الحالة
        // ======================================

        const allowedStatuses = [
    "متوفرة",
    "في الطريق",
    "محجوزة",
    "مباعة"
];

        if (
            !allowedStatuses.includes(
                data.status
            )
        ) {

            return Response.json(
                {
                    success: false,
                    message:
                        "حالة السيارة غير صحيحة"
                },
                {
                    status: 400
                }
            );

        }


        // ======================================
        // التأكد من وجود السيارة
        // ======================================

        const car =
            await context.env.DB
                .prepare(`
                    SELECT id
                    FROM cars
                    WHERE id = ?
                `)
                .bind(carId)
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


        // ======================================
        // تحديث الحالة في D1
        // ======================================

        await context.env.DB
            .prepare(`
                UPDATE cars

                SET
                    status = ?,
                    updated_at = CURRENT_TIMESTAMP

                WHERE id = ?
            `)
            .bind(
                data.status,
                carId
            )
            .run();


        return Response.json({
            success: true,
            message:
                "تم تغيير حالة السيارة بنجاح",
            id:
                carId,
            status:
                data.status
        });

    }

    catch (error) {

        console.error(
            "PATCH /api/cars:",
            error
        );


        return Response.json(
            {
                success: false,
                message:
                    error.message ||
                    "حدث خطأ أثناء تغيير حالة السيارة"
            },
            {
                status: 500
            }
        );

    }

}



// ==========================================
// DELETE
// حذف سيارة
//
// DELETE /api/cars?id=123
// ==========================================

export async function onRequestDelete(context) {

    try {
        // =====================================
// التحقق من صلاحية حذف السيارة
// =====================================

const permissionCheck =
    await requirePermission(
        context,
        "cars_delete"
    );

if (!permissionCheck.ok) {
    return permissionCheck.response;
}

const adminAuth =
    permissionCheck.auth;

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


        const numericCarId =
            Number(carId);


        if (
            !Number.isInteger(numericCarId) ||
            numericCarId <= 0
        ) {

            return Response.json(
                {
                    success: false,
                    message:
                        "رقم السيارة غير صحيح"
                },
                {
                    status: 400
                }
            );

        }


        // ======================================
        // التأكد أن السيارة موجودة
        // ======================================

        const car =
            await context.env.DB
                .prepare(`
                    SELECT id
                    FROM cars
                    WHERE id = ?
                `)
                .bind(numericCarId)
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


        // ======================================
        // جلب صور السيارة قبل حذفها
        // ======================================

        const { results: images } =
            await context.env.DB
                .prepare(`
                    SELECT image_url
                    FROM car_images
                    WHERE car_id = ?
                `)
                .bind(numericCarId)
                .all();


        // ======================================
        // حذف الصور من R2
        // ======================================

        for (const image of images) {

            try {

                const imageUrl =
                    new URL(
                        image.image_url,
                        context.request.url
                    );


                const key =
                    imageUrl.searchParams.get(
                        "key"
                    );


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


        // ======================================
        // حذف سجلات الصور من D1
        // ======================================

        await context.env.DB
            .prepare(`
                DELETE FROM car_images
                WHERE car_id = ?
            `)
            .bind(numericCarId)
            .run();


        // ======================================
        // حذف السيارة من D1
        // ======================================

        await context.env.DB
            .prepare(`
                DELETE FROM cars
                WHERE id = ?
            `)
            .bind(numericCarId)
            .run();


        return Response.json({
            success: true,
            message:
                "تم حذف السيارة بنجاح"
        });

    }

    catch (error) {

        console.error(
            "DELETE /api/cars:",
            error
        );


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
