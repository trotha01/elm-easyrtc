port module Main exposing (..)

import Html exposing (Html, h2, div, text, input, button, hr, textarea, li, ul, b)
import Html.Attributes exposing (class, id, type_, placeholder, style)
import Html.Events exposing (onInput, onClick)


{-| TODO:
 - Let user specify room
 - Leave Room/Logout
 - Handle server errors (retry connecting for the user to the same room)
-}



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
    , message : String
    , messages : List Message
    , id : String
    , rooms : List String
    }


init : ( Model, Cmd Msg )
init =
    ( { username = ""
      , message = ""
      , messages = []
      , id = "Not connected yet"
      , rooms = []
      }
    , Cmd.none
    )



-- UPDATE


type Msg
    = UpdateUsername String
    | UpdateMessage String
    | Connect
    | LoginSuccess String
    | RoomList (List String)
    | AddRoom String
    | SendMessage RoomName
    | RecvMessage Message


type alias RoomName =
    String


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        UpdateUsername username ->
            ( { model | username = username }, Cmd.none )

        Connect ->
            ( model, connect { username = model.username } )

        LoginSuccess id ->
            ( { model | id = id }, refreshRoomList () )

        RoomList rooms ->
            ( { model | rooms = rooms }, Cmd.none )

        AddRoom room ->
            ( { model | rooms = room :: model.rooms } |> Debug.log "model", Cmd.none )

        UpdateMessage message ->
            ( { model | message = message }, Cmd.none )

        SendMessage name ->
            ( { model | message = "" }, sendMessage { room = name, message = model.message } )

        RecvMessage message ->
            ( { model | messages = model.messages ++ [ message ] }, Cmd.none )



-- VIEW


view : Model -> Html Msg
view model =
    div []
        [ h2 [] [ text "The Demo" ]
        , div [ class "preconnection" ]
            [ text "Username: "
            , input [ type_ "text", id "userNameField", onInput UpdateUsername ] []
            , div []
                [ button [ id "connectButton", onClick Connect ] [ text "Connect" ]
                ]
            ]
        , div [ class "postconnection" ]
            [ hr [] []
            , div [ id "sendMessageArea" ]
                [ div [ id "iam" ] [ text model.id ]
                , textarea [ id "sendMessageText", placeholder "Enter your message here", onInput UpdateMessage ] []
                , text "Rooms"
                , div [ id "rooms" ] (rooms model)
                ]
            , div [ id "receiveMessageArea" ]
                [ text "Received Messages:"
                , div [ id "conversation" ] [ (viewMessages model.messages) ]
                ]
            ]
        ]


viewMessages : List Message -> Html Msg
viewMessages messages =
    ul [ style [ ( "list-style", "none" ) ] ] (List.map viewMessage messages)


viewMessage : Message -> Html Msg
viewMessage message =
    li []
        [ (b [] [ text <| message.who ++ ": " ])
        , text message.content
        ]


rooms : Model -> List (Html Msg)
rooms model =
    List.map room model.rooms


room : String -> Html Msg
room name =
    div [ id name, class "roomDiv" ]
        [ button [ onClick (SendMessage name) ] [ text name ]
        , div [ id ("roomOccupant_" ++ name), class "roomOccupants" ] []
        ]



{--
        var roomButtonHolder = document.getElementById('rooms');
        var roomdiv = document.createElement("div");
        roomdiv.id = roomid;
        roomdiv.className = "roomDiv";

        var roomButton = document.createElement("button");
        roomButton.onclick = function() {
            sendMessage(null, roomName);
        };
        var roomLabel = (document.createTextNode(roomName));
        roomButton.appendChild(roomLabel);

        roomdiv.appendChild(roomButton);
        roomButtonHolder.appendChild(roomdiv);
        var roomOccupants = document.createElement("div");
        roomOccupants.id = genRoomOccupantName(roomName);
        roomOccupants.className = "roomOccupants";
        roomdiv.appendChild(roomOccupants);
        $(roomdiv).append(" -<a href=\"javascript:\leaveRoom('" + roomName + "')\">leave</a>");
--}
-- SUBSCRIPTIONS


subscriptions model =
    Sub.batch
        [ loginSuccess LoginSuccess
        , roomList RoomList
        , addRoom AddRoom
        , recvMessage RecvMessage
        ]



-- PORTS


type alias Credentials =
    { username : String
    }


type alias Send =
    { message : String
    , room : String
    }


type alias Message =
    { content : String
    , who : String
    }


port connect : Credentials -> Cmd msg


port loginSuccess : (String -> msg) -> Sub msg


port refreshRoomList : () -> Cmd msg


port roomList : (List String -> msg) -> Sub msg


port addRoom : (String -> msg) -> Sub msg


port sendMessage : Send -> Cmd msg


port recvMessage : (Message -> msg) -> Sub msg
