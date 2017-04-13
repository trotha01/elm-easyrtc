port module Main exposing (..)

import Html exposing (Html, h2, div, text, input, button, hr, textarea)
import Html.Attributes exposing (class, id, type_, placeholder)
import Html.Events exposing (onInput, onClick)


-- MAIN


main =
    Html.program
        { init = init
        , update = update
        , view = view
        , subscriptions = subscriptions
        }



-- MODEL


type alias Model =
    { username : String
    , password : String
    , id : String
    }


init : ( Model, Cmd Msg )
init =
    ( { username = "", password = "", id = "Not connected yet" }, Cmd.none )



-- UPDATE


type Msg
    = UpdateUsername String
    | UpdatePassword String
    | Connect
    | LoginSuccess String


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        UpdateUsername username ->
            ( { model | username = username }, Cmd.none )

        UpdatePassword password ->
            ( { model | password = password }, Cmd.none )

        Connect ->
            ( model, connect { username = model.username, password = model.password } )

        LoginSuccess id ->
            ( { model | id = id }, Cmd.none )



-- VIEW


view : Model -> Html Msg
view model =
    div []
        [ h2 [] [ text "The Demo" ]
        , div [ class "preconnection" ]
            [ text "Username: "
            , input [ type_ "text", id "userNameField", onInput UpdateUsername ] []
            , text "Password: "
            , input [ type_ "text", id "credentialField", onInput UpdatePassword ] []
            , div []
                [ button [ id "connectButton", onClick Connect ] [ text "Connect" ]
                ]
            ]
        , div [ class "postconnection" ]
            [ hr [] []
            , div [ id "sendMessageArea" ]
                [ div [ id "iam" ] [ text model.id ]
                , textarea [ id "sendMessageText", placeholder "Enter your message here" ] []
                , text "Rooms"
                , div [ id "rooms" ] []
                ]
            , div [ id "receiveMessageArea" ]
                [ text "Received Messages:"
                , div [ id "conversation" ] []
                ]
            ]
        ]



-- SUBSCRIPTIONS


subscriptions model =
    loginSuccess LoginSuccess



-- PORTS


type alias Credentials =
    { username : String
    , password : String
    }


port connect : Credentials -> Cmd msg


port loginSuccess : (String -> msg) -> Sub msg
