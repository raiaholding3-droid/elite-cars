export async function onRequestGet(context) {

    try {

        const apiKey =
            context.env.APIBARA_API_KEY;


        if (!apiKey) {

            return Response.json({
                success: false,
                message: "APIBARA_API_KEY غير موجود"
            });

        }


        // سيارة حقيقية موجودة لدينا في D1
        const vin =
            "5XYK7CDF4SG324585";


        const url =
            "https://apibara.tech/api/v1/vehicle-auction/vehicles/" +
            encodeURIComponent(vin);


        const response =
            await fetch(
                url,
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


        const text =
            await response.text();


        let data;


        try {

            data =
                JSON.parse(text);

        }

        catch {

            return Response.json({
                success: false,
                http_status:
                    response.status,

                message:
                    "الاستجابة ليست JSON",

                response_preview:
                    text.substring(0, 1000)
            });

        }


        if (!response.ok) {

            return Response.json({
                success: false,
                http_status:
                    response.status,

                apibara_response:
                    data
            });

        }


        const car =
            data.data || {};


        return Response.json({

            success: true,

            http_status:
                response.status,

            vin:
                car.vin || null,

            lot_number:
                car.lot_number || null,

            title:
                car.title || null,

            // هذا هو المهم في الاختبار
            media:
                car.media ?? null

        });

    }

    catch (error) {

        return Response.json(
            {
                success: false,
                message:
                    error.message
            },
            {
                status: 500
            }
        );

    }

}
