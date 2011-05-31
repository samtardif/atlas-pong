(function ($) {
    var SPEEDS = {
            fast_motion: 33,
            slow_motion: 1000
        };

    var Backboard = function (element, width, height) {
        return {
            init_to: function (position, callback) {
                element.css({'top': position.y, 'left': position.x});
                element.animate({
                    'width': width, 
                    'height': height, 
                    'top': position.y - (height/2), 
                    'left': position.x - (width/2)
                }, 1000, callback);
            },

            bounds: function () {
                return {
                    top: element.attr('offsetTop'),
                    left: element.attr('offsetLeft'),
                    bottom: element.attr('offsetTop') + element.attr('offsetHeight'),
                    right: element.attr('offsetLeft') + element.attr('offsetWidth')
                };
            },

            height: function () {
                return height;
            },

            register_keybindings: function (for_paddle) {
                var y_bounds = {
                    min: element.attr('offsetTop'),
                    max: element.attr('offsetTop') + height
                };

                $(document).keydown(function (ev) {
                    if (ev.keyCode === 87) { //w
                        for_paddle.move(y_bounds, -1);
                    } else if (ev.keyCode === 83) { //s
                        for_paddle.move(y_bounds, +1);
                    }
                });
            }
        };
    };

    var Ball = function (element) {
        var height = element.attr('offsetHeight'),
            width = element.attr('offsetWidth'),
            position = {
                x: element.attr("offsetLeft"),
                y: element.attr("offsetTop")
            },
            original_position = {
                x: position.x,
                y: position.y
            },
            generate_motion = function () {
                return {
                    dx: 10 + (-20 * Math.floor(Math.random() * 2)),
                    dy: 10 + (-20 * Math.floor(Math.random() * 2)),
                };
            },
            motion = generate_motion();
        
        return {
            update_position: function (bounds) {
                if (position.y <= bounds.top + 5 || position.y >= bounds.bottom - height - 5) {
                    motion.dy = motion.dy * -1;
                } 

                position.x += motion.dx;
                position.y += motion.dy;

                element.css({
                    "left": position.x,
                    "top": position.y
                });
            },

            reset: function () {
                position.x = original_position.x;
                position.y = original_position.y;
                element.animate({"top": position.y, "left": position.x}, 1000);
                motion = generate_motion();
            },

            register_click_handler: function (callback) {
                element.click(callback);
            },

            bounds: function () {
                return {
                    top: position.y,
                    bottom: position.y + height,
                    left: position.x,
                    right: position.x + width
                };
            },

            width: function () {
                return width;
            },

            height: function () {
                return height;
            },

            motion: function () {
                return motion;
            },

            invert_dx: function () {
                motion.dx = motion.dx * -1;
            },

            impart_spin: function () {
                var update = function (direction) {
                    motion[direction] += 10 * (motion[direction] / 10);
                    if (Math.abs(motion[direction]) > 30) {
                        motion[direction] = 30 * (motion[direction] > 0 ? 1 : -1);
                    }
                };

                if (Math.floor(Math.random() * 3) === 1) {
                    if (Math.floor(Math.random() * 3) === 1) {
                        update('dy');
                    } else {
                        update('dx');
                    }
                }
            },

            is_moving_left: function () {
                return motion.dx < 0;
            },

            is_moving_right: function () {
                return motion.dx > 0;
            }, 

            init_to: function (center, callback) {
                element.addClass("ball");
                element.addClass("active");
                height = element.attr('offsetHeight');
                width = element.attr('offsetWidth');
                position.y = original_position.y = center.y - (height/2);
                position.x = original_position.x = center.x - (width/2);
                element.animate({"top": position.y, "left": position.x}, 1000, callback);
            }
        };
    };

    var Paddle = function (element, id) {
        var height = 150,
            width = 20,
            movement_offset = 15,
            position = {
                x: element.attr("offsetLeft"),
                y: element.attr("offsetTop")
            };

        element.attr('id', id);

        return {
            move: function (y_bounds, modifier) {
                var offset = movement_offset * modifier,
                    updated_y = position.y + offset;

                if (updated_y >= y_bounds.min && updated_y <= y_bounds.max - height) {
                    position.y = updated_y;
                    element.css('top', updated_y);
                }
            },

            move_to: function (y, speed) {
                element.clearQueue();
                element.animate({'top': y}, speed);
            },

            bounds: function () {
                position.x = element.attr('offsetLeft');
                position.y = element.attr('offsetTop');
                return {
                    top: position.y,
                    bottom: position.y + height,
                    left: position.x,
                    right: position.x + width
                };
            },

            height: function () {
                return height;
            },

            init_to: function (center, callback) {
                element.addClass("paddle");
                element.animate({
                    "font-size": "20px", 
                    "top": center.y - (height/2), 
                    "left": center.x
                }, 500).animate({
                    'background-color': element.css('color')
                }, 200).animate({
                    "height": height, 
                    "width": width, 
                }, 200, callback);
        
                position.x = center.x;
                position.y = center.y - (height/2);
            }
        };
    };

    var AI = function (board, ball, paddle) {
        var speed = 1000,
            target = 0;

        return {
            update: function () {
                var board_bounds = board.bounds(),
                    ball_bounds = ball.bounds(),
                    ball_motion = ball.motion(),
                    paddle_bounds = paddle.bounds(),
                    board_height = board.height();

                if (ball_motion.dx < 0) return;

                var min_y = board_bounds.top + 10,
                    max_y = board_bounds.bottom - paddle.height() - 10;

                while (ball_bounds.left < paddle_bounds.left) {
                    ball_bounds.left += ball_motion.dx;
                    ball_bounds.top += ball_motion.dy;
                }

                var ball_y = ball_bounds.top;

                if (ball_y < board_bounds.top) {
                    ball_y = board_bounds.top + Math.abs(board_bounds.top - ball_y);
                } else if (ball_y > board_bounds.bottom) {
                    ball_y = board_bounds.bottom - (ball_y - board_bounds.bottom);
                }

                if (ball_y + paddle.height() > max_y) {
                    ball_y = max_y;
                } else if (ball_y < min_y) {
                    ball_y = min_y;
                }

                if (ball_y !== target) {
                    paddle.move_to(ball_y, speed);
                    target = ball_y;
                } 
            },
            
            increase_level: function () {
                speed = speed / 2;
            }
        };
    }

    var Scoreboard = function (element) {
        var player1_score = $("<p id='player1-score'>0</p>").appendTo(element),
            player2_score = $("<p id='player2-score'>0</p>").appendTo(element),
            increase_score = function (element) {
                element.text(parseInt(element.text(),10) + 1);
            };

        return {
            increase_player1_score: function () {
                increase_score(player1_score);
            },

            increase_player2_score: function () {
                increase_score(player2_score);
            },

            init_to: function (bounds, width) {
                element.css({'top': bounds.top, 'left': bounds.left, 'width': width, 'height': '30px'});
            }
        };
    };

    var Countdown = function (element, countdown_callback) {
        var font_size = 150;

        element.css('font-size', font_size);

        return {
            start: function (from) {
                (function (current) {
                    if (current === 0) {
                        element.hide();
                        countdown_callback();
                    } else {
                        element.show().text(current);
                        var func = arguments.callee;
                        setTimeout(function () {
                            func(current - 1);
                        }, 1000);
                    }
                })(from);
            },

            set_center: function (center) {
                element.css('display','block');
                element.css({
                    'left': center.x - (element.attr('offsetWidth')/2),
                    'top': center.y + 30
                });
            }
        };
    }

    var Engine = function () {
        var collision = function (paddle_bounds, ball_bounds) {
            if (ball_bounds.bottom < paddle_bounds.top) return false;
            if (ball_bounds.top > paddle_bounds.bottom) return false;
            if (ball_bounds.right < paddle_bounds.left) return false;
            if (ball_bounds.left > paddle_bounds.right) return false;

            return true;
        };

        return {
            check_collisions: function (ball, player_paddle, ai_paddle) {
                var ball_motion = ball.motion(),
                    ball_bounds = ball.bounds(),
                    player_bounds = player_paddle.bounds(),
                    ai_bounds = ai_paddle.bounds();

                if ((ball.is_moving_left() && collision(player_bounds, ball_bounds)) || 
                        (ball.is_moving_right() && collision(ai_bounds, ball_bounds))) {
                    ball.invert_dx();
                    ball.impart_spin();
                } else {
                    if (ball_bounds.left <= player_bounds.left) {
                        return -1;
                    } else if (ball_bounds.right >= ai_bounds.right) {
                        return 1;
                    }
                }
                
                return 0;
            }
        };
    };

    var Pong = function ($body) {
        var screen_center = {x: $(window).width()/2, y: $(window).height()/2};
            backboard = Backboard($("<div id='backboard'></div>").appendTo($body), 800, 500),
            ball = Ball($(".logo.global")),
            player_paddle = Paddle($("#title-text").find("span:first-child"), 'player-paddle'),
            ai_paddle = Paddle($("#title-text").find("span:first-child").next(), 'ai-paddle'),
            ai = AI(backboard, ball, ai_paddle),
            scoreboard = Scoreboard($("<div id='scoreboard'></div>").appendTo($body)),
            engine = Engine(),

            make_shit_happen = function () {
                ball.update_position(backboard.bounds());
                ai.update();

                var collision = engine.check_collisions(ball, player_paddle, ai_paddle);
                if (collision === 0) {
                    setTimeout(make_shit_happen, SPEEDS.fast_motion);
                } else {
                    if (collision === -1) {
                        scoreboard.increase_player2_score();
                    } else {
                        scoreboard.increase_player1_score();
                    }
                }
            },

            countdown = Countdown($("<div class='countdown'>3</div>").appendTo($body), make_shit_happen),

            player_paddle_init_callback = function () {
                backboard.register_keybindings(player_paddle);
                countdown.set_center(screen_center);
                countdown.start(3);
            },

            ai_paddle_init_callback = function () {
                player_paddle.init_to({y: screen_center.y, x: backboard.bounds().left + 15}, player_paddle_init_callback);
            },

            ball_init_callback = function () {
                ai_paddle.init_to({y: screen_center.y, x: backboard.bounds().right - 35}, ai_paddle_init_callback);
            },

            backboard_init_callback = function () {
                var board_bounds = backboard.bounds(),
                    board_width = board_bounds.right - board_bounds.left,
                    board_height = board_bounds.bottom - board_bounds.top,
                    center = {
                        x: board_bounds.left + (board_width/2),
                        y: board_bounds.top + (board_height/2)
                    };

                scoreboard.init_to({top: board_bounds.bottom, left: board_bounds.left}, board_width);
                ball.init_to(screen_center, ball_init_callback);
            };

        ball.register_click_handler(function () {
            ball.reset();
            ai.increase_level();
            countdown.start(3);
            return false;
        });

        return {
            init_game: function () {
                $("<div class='dimmer'></div>").appendTo($body).fadeIn('slow', function () {
                    backboard.init_to(screen_center, backboard_init_callback);
                });
            },
                           

        };
    };



    $(function () {
        (function () {
            var title_element = $("#title-text"),
                anchor = title_element.find("a"),
                title_text = anchor.text().split(" "),
                fg_color = anchor.css("color");

            title_element.css("color", fg_color);
            title_element.empty();
            for (var i = 0; i < title_text.length; i++) {
                var span = $("<span>" + title_text[i] + "</span>");
                title_element.append(span);
            }
        })();

        var $body = $('body'),
            pong = Pong($body),
            trigger = $("<div id='pong-trigger'></div>").appendTo($body);

        trigger.click(pong.init_game);
    });
})(require('speakeasy/jquery').jQuery);
