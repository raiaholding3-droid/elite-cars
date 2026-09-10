export async function onRequestPost(context) {

    try {

        const body =
            await context.request.json();

        const ruleId =
            Number(body.rule_id);


        if (!ruleId) {

            return Response.json(
                {
                    success: false,
                    message: "رقم المهمة غير صحيح"
                },
                {
                    status: 400
                }
            );

        }


        // =====================================
        // جلب المهمة من D1
        // =====================================

        const rule =
            await context.env.DB
                .prepare(`
                    SELECT *
                    FROM auction_watch_rules
                    WHERE id = ?
                `)
                .bind(ruleId)
                .first();


        if (!rule) {

            return Response.json(
                {
                    success: false,
                    message: "المهمة غير موجودة"
                },
                {
                    status: 404
                }
            );

        }


        if (!rule.enabled) {

            return Response.json(
                {
                    success: false,
                    message: "المهمة متوقفة"
                },
                {
                    status: 400
                }
            );

        }


        // =====================================
        // مفتاح Apibara
        // =====================================

        const apiKey =
            context.env.APIBARA_API_KEY;


        if (!apiKey) {

            return Response.json(
                {
                    success: false,
                    message:
                        "APIBARA_API_KEY غير موجود"
                },
                {
                    status: 500
                }
            );

        }


        // =====================================
        // بناء رابط البحث
        // =====================================

        const url =
            new URL(
                "https://apibara.tech/api/v1/vehicle-auction/vehicles"
            );


        if (rule.brand) {

            url.searchParams.set(
                "make",
                rule.brand
            );

        }


        if (rule.model) {

            url.searchParams.set(
                "model",
                rule.model
            );

        }


        if (rule.year_from) {

            url.searchParams.set(
                "year_from",
                rule.year_from
            );

        }


        if (rule.year_to) {

            url.searchParams.set(
                "year_to",
                rule.year_to
            );

        }


        if (rule.price_min) {

            url.searchParams.set(
                "price_min",
                rule.price_min
            );

        }


        if (rule.price_max) {

            url.searchParams.set(
                "price_max",
                rule.price_max
            );

        }


        if (rule.fast_buy_only) {

            url.searchParams.set(
                "lot_status",
                "Buy Now"
            );

        }


        if (
            rule.auction_house === "Copart"
        ) {

            url.searchParams.set(
                "platform",
                "copart"
            );

        }


        if (
            rule.auction_house === "IAA" ||
            rule.auction_house === "IAAI"
        ) {

            url.searchParams.set(
                "platform",
                "iaai"
            );

        }


        // مؤقتًا سيارتان فقط
        // لتقليل استهلاك API
        url.searchParams.set(
            "per_page",
            "2"
        );


        // =====================================
        // طلب واحد فقط من Apibara
        // =====================================

        const response =
            await fetch(
                url.toString(),
                {
                    method: "GET",

                    headers: {

                        "Accept":
                            "application/json",

                        "X-API-Key":
                            apiKey

                    }

                }
            );


        let data;


        try {

            data =
                await response.json();

        }

        catch {

            throw new Error(
                `استجابة Apibara ليست JSON - HTTP ${response.status}`
            );

        }


        if (!response.ok) {

            throw new Error(
                data.message ||
                `Apibara HTTP ${response.status}`
            );

        }


        if (!data.ok) {

            throw new Error(
                data.message ||
                "Apibara أعاد نتيجة غير ناجحة"
            );

        }


        const cars =
            Array.isArray(data.data)
                ? data.data
                : [];


        let inserted = 0;
        let updated = 0;
        let matched = 0;


        // =====================================
        // حفظ / تحديث السيارات
        // =====================================

        for (const car of cars) {

            const platform =
                car.platform ||
                null;


            const lotNumber =
                car.lot_number
                    ? String(
                        car.lot_number
                    )
                    : null;


            if (!lotNumber) {

                continue;

            }


            const auctionHouse =
                platform === "iaai"
                    ? "IAA"
                    : platform === "copart"
                        ? "Copart"
                        : platform;


            const existingCar =
                await context.env.DB
                    .prepare(`
                        SELECT
                            id,
                            main_image
                        FROM auction_cars
                        WHERE
                            auction_house = ?
                            AND lot_number = ?
                    `)
                    .bind(
                        auctionHouse,
                        lotNumber
                    )
                    .first();


            const title =
                car.title ||
                [
                    car.year,
                    car.make,
                    car.model
                ]
                .filter(Boolean)
                .join(" ");


            const odometer =
                car.odometer?.mi ??
                car.odometer ??
                car.mileage ??
                null;


            const currentBid =
                car.pricing?.current_bid_usd ??
                car.current_bid ??
                null;


            const buyNowPrice =
                car.pricing?.buy_now_usd ??
                car.buy_now_price ??
                car.buy_now ??
                null;


            const primaryDamage =
                car.condition?.primary_damage ??
                car.primary_damage ??
                null;


            const secondaryDamage =
                car.condition?.secondary_damage ??
                car.secondary_damage ??
                null;


            const damage =
                [
                    primaryDamage,
                    secondaryDamage
                ]
                .filter(Boolean)
                .join(" / ") ||
                null;


            const auctionDate =
                car.auction_date ??
                car.sale_date ??
                null;


            const sourceUrl =
                car.url ??
                car.source_url ??
                null;


            // =====================================
            // الصور
            // =====================================
            // حاليًا لا نرسل طلب إضافي للصور
            // حتى لا نستهلك حصة Apibara.
            // إذا كانت السيارة لديها صورة محفوظة
            // سابقًا نحافظ عليها.

            const mainImage =
                existingCar?.main_image ??
                null;


            // =====================================
            // تحديث سيارة موجودة
            // =====================================

            if (existingCar) {

                await context.env.DB
                    .prepare(`
                        UPDATE auction_cars

                        SET
                            source_site = ?,
                            external_id = ?,
                            vin = ?,
                            name = ?,
                            brand = ?,
                            model = ?,
                            trim = ?,
                            year = ?,
                            mileage = ?,
                            color = ?,
                            fuel_type = ?,
                            body_type = ?,
                            engine = ?,
                            transmission = ?,
                            drivetrain = ?,
                            damage = ?,
                            current_bid = ?,
                            buy_now_price = ?,
                            auction_date = ?,
                            source_url = ?,
                            main_image = ?,
                            status = 'active',
                            last_seen_at =
                                CURRENT_TIMESTAMP,
                            updated_at =
                                CURRENT_TIMESTAMP

                        WHERE id = ?
                    `)
                    .bind(
                        "apibara",
                        car.id || null,
                        car.vin || null,
                        title ||
                            "Auction Vehicle",
                        car.make || null,
                        car.model || null,
                        car.trim || null,
                        car.year || null,
                        odometer,
                        car.color || null,
                        car.fuel_type || null,
                        car.body_type || null,
                        car.engine ||
                            car.engine_description ||
                            null,
                        car.transmission ||
                            null,
                        car.drivetrain ||
                            null,
                        damage,
                        currentBid,
                        buyNowPrice,
                        auctionDate,
                        sourceUrl,
                        mainImage,
                        existingCar.id
                    )
                    .run();


                updated++;


                await context.env.DB
                    .prepare(`
                        INSERT OR IGNORE INTO
                        auction_car_matches
                        (
                            car_id,
                            rule_id
                        )

                        VALUES (?, ?)
                    `)
                    .bind(
                        existingCar.id,
                        ruleId
                    )
                    .run();


                matched++;

            }


            // =====================================
            // إضافة سيارة جديدة
            // =====================================

            else {

                const insertResult =
                    await context.env.DB
                        .prepare(`
                            INSERT INTO auction_cars
                            (
                                source_site,
                                external_id,
                                auction_house,
                                lot_number,
                                vin,
                                name,
                                brand,
                                model,
                                trim,
                                year,
                                mileage,
                                color,
                                fuel_type,
                                body_type,
                                engine,
                                transmission,
                                drivetrain,
                                damage,
                                current_bid,
                                buy_now_price,
                                auction_date,
                                source_url,
                                main_image,
                                status,
                                first_seen_at,
                                last_seen_at,
                                created_at,
                                updated_at
                            )

                            VALUES
                            (
                                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                                ?, ?, ?, 'active',
                                CURRENT_TIMESTAMP,
                                CURRENT_TIMESTAMP,
                                CURRENT_TIMESTAMP,
                                CURRENT_TIMESTAMP
                            )
                        `)
                        .bind(
                            "apibara",
                            car.id || null,
                            auctionHouse,
                            lotNumber,
                            car.vin || null,
                            title ||
                                "Auction Vehicle",
                            car.make || null,
                            car.model || null,
                            car.trim || null,
                            car.year || null,
                            odometer,
                            car.color || null,
                            car.fuel_type || null,
                            car.body_type || null,
                            car.engine ||
                                car.engine_description ||
                                null,
                            car.transmission ||
                                null,
                            car.drivetrain ||
                                null,
                            damage,
                            currentBid,
                            buyNowPrice,
                            auctionDate,
                            sourceUrl,
                            null
                        )
                        .run();


                const newCarId =
                    insertResult.meta
                        .last_row_id;


                inserted++;


                await context.env.DB
                    .prepare(`
                        INSERT OR IGNORE INTO
                        auction_car_matches
                        (
                            car_id,
                            rule_id
                        )

                        VALUES (?, ?)
                    `)
                    .bind(
                        newCarId,
                        ruleId
                    )
                    .run();


                matched++;

            }

        }


        // =====================================
        // تحديث وقت آخر تشغيل
        // =====================================

        await context.env.DB
            .prepare(`
                UPDATE auction_watch_rules

                SET
                    source_site = 'apibara',
                    last_run_at =
                        CURRENT_TIMESTAMP,
                    updated_at =
                        CURRENT_TIMESTAMP

                WHERE id = ?
            `)
            .bind(ruleId)
            .run();


        return Response.json({

            success: true,

            message:
                "تم جلب وحفظ سيارات المزاد بنجاح",

            received_cars:
                cars.length,

            inserted:
                inserted,

            updated:
                updated,

            matched:
                matched,

            api_requests_used:
                1

        });

    }

    catch (error) {

        console.error(error);


        return Response.json(
            {
                success: false,

                message:
                    error.message ||
                    "حدث خطأ أثناء جلب سيارات المزاد"
            },
            {
                status: 500
            }
        );

    }

}
