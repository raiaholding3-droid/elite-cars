export async function onRequestGet(context) {

    try {

        const { results } =
            await context.env.DB
                .prepare(`
                    SELECT *
                    FROM auction_watch_rules
                    ORDER BY id DESC
                `)
                .all();


        return Response.json({
            success: true,
            rules: results
        });

    }

    catch (error) {

        return Response.json(
            {
                success: false,
                message: error.message
            },
            {
                status: 500
            }
        );

    }

}


export async function onRequestPost(context) {

    try {

        const data =
            await context.request.json();


        if (
            !data.name ||
            !data.brand
        ) {

            return Response.json(
                {
                    success: false,
                    message:
                        "اسم المهمة والماركة مطلوبان"
                },
                {
                    status: 400
                }
            );

        }


        const result =
            await context.env.DB
                .prepare(`
                    INSERT INTO auction_watch_rules
                    (
                        name,
                        source_site,
                        brand,
                        model,
                        year_from,
                        year_to,
                        price_min,
                        price_max,
                        auction_house,
                        fast_buy_only,
                        enabled
                    )

                    VALUES
                    (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `)
                .bind(
    data.name,
    "apibara",
    data.brand,
                    data.model || null,
                    data.year_from || null,
                    data.year_to || null,
                    data.price_min || null,
                    data.price_max || null,
                    data.auction_house || null,
                    data.fast_buy_only ? 1 : 0,
                    data.enabled ? 1 : 0
                )
                .run();


        return Response.json(
            {
                success: true,
                id: result.meta.last_row_id
            },
            {
                status: 201
            }
        );

    }

    catch (error) {

        return Response.json(
            {
                success: false,
                message: error.message
            },
            {
                status: 500
            }
        );

    }

}


export async function onRequestDelete(context) {

    try {

        const url =
            new URL(
                context.request.url
            );


        const id =
            url.searchParams.get("id");


        if (!id) {

            return Response.json(
                {
                    success: false,
                    message: "رقم المهمة مطلوب"
                },
                {
                    status: 400
                }
            );

        }


        await context.env.DB
            .prepare(`
                DELETE FROM auction_watch_rules
                WHERE id = ?
            `)
            .bind(
                Number(id)
            )
            .run();


        return Response.json({
            success: true
        });

    }

    catch (error) {

        return Response.json(
            {
                success: false,
                message: error.message
            },
            {
                status: 500
            }
        );

    }

}
