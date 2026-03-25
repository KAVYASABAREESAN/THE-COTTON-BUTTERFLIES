(function(){
let translateObjs = {};
const trans = (...a) => {
    return translateObjs[a[0x0]] = a, '';
};
function regTextVar(a, b) {
    var c = ![];
    return d(b);
    function d(k, l) {
        switch (k['toLowerCase']()) {
        case 'title':
        case 'subtitle':
        case 'photo.title':
        case 'photo.description':
            var m = (function () {
                switch (k['toLowerCase']()) {
                case 'title':
                case 'photo.title':
                    return 'media.label';
                case 'subtitle':
                    return 'media.data.subtitle';
                case 'photo.description':
                    return 'media.data.description';
                }
            }());
            if (m)
                return function () {
                    var r, s, t = (l && l['viewerName'] ? this['getComponentByName'](l['viewerName']) : undefined) || this['getMainViewer']();
                    if (k['toLowerCase']()['startsWith']('photo'))
                        r = this['getByClassName']('PhotoAlbumPlayListItem')['filter'](function (v) {
                            var w = v['get']('player');
                            return w && w['get']('viewerArea') == t;
                        })['map'](function (v) {
                            return v['get']('media')['get']('playList');
                        });
                    else
                        r = this['_getPlayListsWithViewer'](t), s = j['bind'](this, t);
                    if (!c) {
                        for (var u = 0x0; u < r['length']; ++u) {
                            r[u]['bind']('changing', f, this);
                        }
                        c = !![];
                    }
                    return i['call'](this, r, m, s);
                };
            break;
        case 'tour.name':
        case 'tour.description':
            return function () {
                return this['get']('data')['tour']['locManager']['trans'](k);
            };
        default:
            if (k['toLowerCase']()['startsWith']('viewer.')) {
                var n = k['split']('.'), o = n[0x1];
                if (o) {
                    var p = n['slice'](0x2)['join']('.');
                    return d(p, { 'viewerName': o });
                }
            } else {
                if (k['toLowerCase']()['startsWith']('quiz.') && 'Quiz' in TDV) {
                    var q = undefined, m = (function () {
                            switch (k['toLowerCase']()) {
                            case 'quiz.questions.answered':
                                return TDV['Quiz']['PROPERTY']['QUESTIONS_ANSWERED'];
                            case 'quiz.question.count':
                                return TDV['Quiz']['PROPERTY']['QUESTION_COUNT'];
                            case 'quiz.items.found':
                                return TDV['Quiz']['PROPERTY']['ITEMS_FOUND'];
                            case 'quiz.item.count':
                                return TDV['Quiz']['PROPERTY']['ITEM_COUNT'];
                            case 'quiz.score':
                                return TDV['Quiz']['PROPERTY']['SCORE'];
                            case 'quiz.score.total':
                                return TDV['Quiz']['PROPERTY']['TOTAL_SCORE'];
                            case 'quiz.time.remaining':
                                return TDV['Quiz']['PROPERTY']['REMAINING_TIME'];
                            case 'quiz.time.elapsed':
                                return TDV['Quiz']['PROPERTY']['ELAPSED_TIME'];
                            case 'quiz.time.limit':
                                return TDV['Quiz']['PROPERTY']['TIME_LIMIT'];
                            case 'quiz.media.items.found':
                                return TDV['Quiz']['PROPERTY']['PANORAMA_ITEMS_FOUND'];
                            case 'quiz.media.item.count':
                                return TDV['Quiz']['PROPERTY']['PANORAMA_ITEM_COUNT'];
                            case 'quiz.media.questions.answered':
                                return TDV['Quiz']['PROPERTY']['PANORAMA_QUESTIONS_ANSWERED'];
                            case 'quiz.media.question.count':
                                return TDV['Quiz']['PROPERTY']['PANORAMA_QUESTION_COUNT'];
                            case 'quiz.media.score':
                                return TDV['Quiz']['PROPERTY']['PANORAMA_SCORE'];
                            case 'quiz.media.score.total':
                                return TDV['Quiz']['PROPERTY']['PANORAMA_TOTAL_SCORE'];
                            case 'quiz.media.index':
                                return TDV['Quiz']['PROPERTY']['PANORAMA_INDEX'];
                            case 'quiz.media.count':
                                return TDV['Quiz']['PROPERTY']['PANORAMA_COUNT'];
                            case 'quiz.media.visited':
                                return TDV['Quiz']['PROPERTY']['PANORAMA_VISITED_COUNT'];
                            default:
                                var s = /quiz\.([\w_]+)\.(.+)/['exec'](k);
                                if (s) {
                                    q = s[0x1];
                                    switch ('quiz.' + s[0x2]) {
                                    case 'quiz.score':
                                        return TDV['Quiz']['OBJECTIVE_PROPERTY']['SCORE'];
                                    case 'quiz.score.total':
                                        return TDV['Quiz']['OBJECTIVE_PROPERTY']['TOTAL_SCORE'];
                                    case 'quiz.media.items.found':
                                        return TDV['Quiz']['OBJECTIVE_PROPERTY']['PANORAMA_ITEMS_FOUND'];
                                    case 'quiz.media.item.count':
                                        return TDV['Quiz']['OBJECTIVE_PROPERTY']['PANORAMA_ITEM_COUNT'];
                                    case 'quiz.media.questions.answered':
                                        return TDV['Quiz']['OBJECTIVE_PROPERTY']['PANORAMA_QUESTIONS_ANSWERED'];
                                    case 'quiz.media.question.count':
                                        return TDV['Quiz']['OBJECTIVE_PROPERTY']['PANORAMA_QUESTION_COUNT'];
                                    case 'quiz.questions.answered':
                                        return TDV['Quiz']['OBJECTIVE_PROPERTY']['QUESTIONS_ANSWERED'];
                                    case 'quiz.question.count':
                                        return TDV['Quiz']['OBJECTIVE_PROPERTY']['QUESTION_COUNT'];
                                    case 'quiz.items.found':
                                        return TDV['Quiz']['OBJECTIVE_PROPERTY']['ITEMS_FOUND'];
                                    case 'quiz.item.count':
                                        return TDV['Quiz']['OBJECTIVE_PROPERTY']['ITEM_COUNT'];
                                    case 'quiz.media.score':
                                        return TDV['Quiz']['OBJECTIVE_PROPERTY']['PANORAMA_SCORE'];
                                    case 'quiz.media.score.total':
                                        return TDV['Quiz']['OBJECTIVE_PROPERTY']['PANORAMA_TOTAL_SCORE'];
                                    }
                                }
                            }
                        }());
                    if (m)
                        return function () {
                            var r = this['get']('data')['quiz'];
                            if (r) {
                                if (!c) {
                                    if (q != undefined) {
                                        if (q == 'global') {
                                            var s = this['get']('data')['quizConfig'], t = s['objectives'];
                                            for (var u = 0x0, v = t['length']; u < v; ++u) {
                                                r['bind'](TDV['Quiz']['EVENT_OBJECTIVE_PROPERTIES_CHANGE'], h['call'](this, t[u]['id'], m), this);
                                            }
                                        } else
                                            r['bind'](TDV['Quiz']['EVENT_OBJECTIVE_PROPERTIES_CHANGE'], h['call'](this, q, m), this);
                                    } else
                                        r['bind'](TDV['Quiz']['EVENT_PROPERTIES_CHANGE'], g['call'](this, m), this);
                                    c = !![];
                                }
                                try {
                                    var w = 0x0;
                                    if (q != undefined) {
                                        if (q == 'global') {
                                            var s = this['get']('data')['quizConfig'], t = s['objectives'];
                                            for (var u = 0x0, v = t['length']; u < v; ++u) {
                                                w += r['getObjective'](t[u]['id'], m);
                                            }
                                        } else
                                            w = r['getObjective'](q, m);
                                    } else {
                                        w = r['get'](m);
                                        if (m == TDV['Quiz']['PROPERTY']['PANORAMA_INDEX'])
                                            w += 0x1;
                                    }
                                    return w;
                                } catch (x) {
                                    return undefined;
                                }
                            }
                        };
                }
            }
            break;
        }
        return function () {
            return '';
        };
    }
    function e() {
        var k = this['get']('data');
        k['updateText'](k['translateObjs'][a], a['split']('.')[0x0]);
        let l = a['split']('.'), m = l[0x0] + '_vr';
        m in this && k['updateText'](k['translateObjs'][a], m);
    }
    function f(k) {
        var l = k['data']['nextSelectedIndex'];
        if (l >= 0x0) {
            var m = k['source']['get']('items')[l], n = function () {
                    m['unbind']('begin', n, this), e['call'](this);
                };
            m['bind']('begin', n, this);
        }
    }
    function g(k) {
        return function (l) {
            k in l && e['call'](this);
        }['bind'](this);
    }
    function h(k, l) {
        return function (m, n) {
            k == m && l in n && e['call'](this);
        }['bind'](this);
    }
    function i(k, l, m) {
        for (var n = 0x0; n < k['length']; ++n) {
            var o = k[n], p = o['get']('selectedIndex');
            if (p >= 0x0) {
                var q = l['split']('.'), r = o['get']('items')[p];
                if (m !== undefined && !m['call'](this, r))
                    continue;
                for (var s = 0x0; s < q['length']; ++s) {
                    if (r == undefined)
                        return '';
                    r = 'get' in r ? r['get'](q[s]) : r[q[s]];
                }
                return r;
            }
        }
        return '';
    }
    function j(k, l) {
        var m = l['get']('player');
        return m !== undefined && m['get']('viewerArea') == k;
    }
}
var script = {"children":["this.MainViewer"],"hash": "bcb491acecf6088f5ccac8ac463881790da38a3146fbd69dba61a8e8efe25e3d", "definitions": [{"touchControlMode":"drag_rotation","displayPlaybackBar":true,"arrowKeysAction":"translate","aaEnabled":true,"class":"PanoramaPlayer","mouseControlMode":"drag_rotation","id":"MainViewerPanoramaPlayer","keepModel3DLoadedWithoutLocation":true,"viewerArea":"this.MainViewer"},{"hfovMin":60,"vfov":180,"class":"Video360","id":"media_E8A00A3D_F17E_905C_41DA_B0415DF55474","video":["this.videores_E9E9CE24_F176_906D_41EB_3F16EB144D78"],"pitch":0,"adjacentPanoramas":[{"data":{"overlayID":"overlay_E99ABD34_F17A_F06D_41D7_78397ACFBE2A"},"distance":0.87,"class":"AdjacentPanorama","backwardYaw":-126.55,"select":"this.overlay_E99ABD34_F17A_F06D_41D7_78397ACFBE2A.get('areas').forEach(function(a){ a.trigger('click') })","panorama":"this.media_E7B877DF_F17E_BFDB_41D2_8F8EC283B0C6","yaw":-177.59}],"thumbnailUrl":"media/media_E8A00A3D_F17E_905C_41DA_B0415DF55474_t.webp","overlays":["this.overlay_E99ABD34_F17A_F06D_41D7_78397ACFBE2A"],"hfovMax":140,"label":trans('media_E8A00A3D_F17E_905C_41DA_B0415DF55474.label'),"hfov":360,"data":{"label":"vid1"}},{"hfovMin":60,"vfov":180,"class":"Video360","id":"media_E7B877DF_F17E_BFDB_41D2_8F8EC283B0C6","video":["this.videores_EB315F2F_F16A_907B_41DE_079D0AE08B84"],"pitch":0,"adjacentPanoramas":[{"data":{"overlayID":"overlay_E959E046_F17A_702C_41C3_29F55B702CB6"},"distance":0.64,"class":"AdjacentPanorama","select":"this.overlay_E959E046_F17A_702C_41C3_29F55B702CB6.get('areas').forEach(function(a){ a.trigger('click') })","panorama":"this.media_E7BA925A_F17E_9024_41C7_F3484DA811BA","yaw":-119.79},{"data":{"overlayID":"overlay_E98C6565_F17A_90EC_41EB_2E344C5FBC3D"},"distance":2.1,"class":"AdjacentPanorama","backwardYaw":-177.59,"select":"this.overlay_E98C6565_F17A_90EC_41EB_2E344C5FBC3D.get('areas').forEach(function(a){ a.trigger('click') })","panorama":"this.media_E8A00A3D_F17E_905C_41DA_B0415DF55474","yaw":-126.55}],"thumbnailUrl":"media/media_E7B877DF_F17E_BFDB_41D2_8F8EC283B0C6_t.webp","overlays":["this.overlay_E959E046_F17A_702C_41C3_29F55B702CB6","this.overlay_E98C6565_F17A_90EC_41EB_2E344C5FBC3D"],"hfovMax":140,"label":trans('media_E7B877DF_F17E_BFDB_41D2_8F8EC283B0C6.label'),"hfov":360,"data":{"label":"vid2"}},{"subtitlesGap":0,"subtitlesBackgroundColor":"#000000","toolTipFontColor":"#606060","playbackBarHeadBorderColor":"#000000","progressBackgroundColorRatios":[0],"class":"ViewerArea","playbackBarBorderSize":0,"progressRight":"33%","subtitlesTextShadowVerticalLength":1,"progressOpacity":0.7,"data":{"name":"Main Viewer"},"subtitlesTextShadowOpacity":1,"propagateClick":false,"progressBarBorderColor":"#000000","toolTipFontSize":"1.11vmin","progressBarBackgroundColorDirection":"horizontal","progressBarBackgroundColorRatios":[0],"subtitlesFontColor":"#FFFFFF","playbackBarBackgroundOpacity":1,"playbackBarHeadShadowBlurRadius":3,"surfaceReticleColor":"#FFFFFF","vrPointerColor":"#FFFFFF","playbackBarHeadHeight":15,"playbackBarLeft":0,"playbackBarHeadShadowColor":"#000000","subtitlesTop":0,"progressBorderColor":"#000000","progressBarBackgroundColor":["#3399FF"],"playbackBarHeadBackgroundColorRatios":[0,1],"playbackBarHeadShadow":true,"subtitlesTextShadowColor":"#000000","playbackBarHeadBorderSize":0,"surfaceReticleSelectionColor":"#FFFFFF","progressBackgroundColor":["#000000"],"subtitlesFontSize":"3vmin","playbackBarHeadBackgroundColor":["#111111","#666666"],"progressHeight":2,"progressBorderSize":0,"progressBottom":10,"playbackBarBottom":5,"progressBarBorderRadius":2,"firstTransitionDuration":0,"subtitlesBottom":50,"toolTipBorderColor":"#767676","progressBarBorderSize":0,"subtitlesBackgroundOpacity":0.2,"toolTipTextShadowColor":"#000000","playbackBarHeadShadowVerticalLength":0,"playbackBarBackgroundColor":["#FFFFFF"],"toolTipPaddingLeft":6,"toolTipShadowColor":"#333138","id":"MainViewer","playbackBarProgressBorderSize":0,"playbackBarHeadWidth":6,"playbackBarBackgroundColorDirection":"vertical","toolTipFontFamily":"Arial","toolTipPaddingBottom":4,"progressBorderRadius":2,"playbackBarHeight":10,"toolTipPaddingTop":4,"playbackBarProgressBorderRadius":0,"subtitlesBorderColor":"#FFFFFF","progressLeft":"33%","vrPointerSelectionColor":"#FF6600","vrThumbstickRotationStep":20,"playbackBarRight":0,"playbackBarProgressBackgroundColor":["#3399FF"],"vrPointerSelectionTime":2000,"subtitlesTextShadowHorizontalLength":1,"playbackBarHeadShadowHorizontalLength":0,"minHeight":50,"minWidth":100,"playbackBarHeadShadowOpacity":0.7,"playbackBarProgressBackgroundColorRatios":[0],"toolTipBackgroundColor":"#F6F6F6","subtitlesFontFamily":"Arial","playbackBarBorderColor":"#FFFFFF","playbackBarProgressBorderColor":"#000000","width":"100%","playbackBarBorderRadius":0,"playbackBarHeadBorderRadius":0,"toolTipPaddingRight":6,"height":"100%"},{"initialPosition":{"pitch":0,"class":"RotationalCameraPosition","yaw":0,"hfov":120},"class":"RotationalCamera","id":"media_E7BA925A_F17E_9024_41C7_F3484DA811BA_camera","enterPointingToHorizon":true},{"hfovMin":60,"vfov":180,"class":"Video360","id":"media_E7BA925A_F17E_9024_41C7_F3484DA811BA","video":["this.videores_EB17A8A0_F15A_9064_41E0_536CA2EEFA98"],"pitch":0,"adjacentPanoramas":[{"data":{"overlayID":"overlay_E94BBE5B_F175_9024_41C4_B089ED97F353"},"distance":1.96,"class":"AdjacentPanorama","select":"this.overlay_E94BBE5B_F175_9024_41C4_B089ED97F353.get('areas').forEach(function(a){ a.trigger('click') })","panorama":"this.media_E8A00A3D_F17E_905C_41DA_B0415DF55474","yaw":-78.61}],"thumbnailUrl":"media/media_E7BA925A_F17E_9024_41C7_F3484DA811BA_t.webp","overlays":["this.overlay_E94BBE5B_F175_9024_41C4_B089ED97F353"],"hfovMax":140,"label":trans('media_E7BA925A_F17E_9024_41C7_F3484DA811BA.label'),"hfov":360,"data":{"label":"vid3"}},{"initialPosition":{"pitch":0,"class":"RotationalCameraPosition","yaw":0,"hfov":120},"class":"RotationalCamera","id":"media_E8A00A3D_F17E_905C_41DA_B0415DF55474_camera","enterPointingToHorizon":true},{"id":"mainPlayList","items":[{"camera":"this.media_E8A00A3D_F17E_905C_41DA_B0415DF55474_camera","media":"this.media_E8A00A3D_F17E_905C_41DA_B0415DF55474","class":"Video360PlayListItem","player":"this.MainViewerPanoramaPlayer","begin":"this.fixTogglePlayPauseButton(this.MainViewerPanoramaPlayer); this.setEndToItemIndex(this.mainPlayList, 0, 1)","start":"this.MainViewerPanoramaPlayer.set('displayPlaybackBar', true); this.MainViewerPanoramaPlayer.set('displayPlayOverlay', false); this.MainViewerPanoramaPlayer.set('clickAction', 'none'); this.changeBackgroundWhilePlay(this.mainPlayList, 0, '#000000'); this.pauseGlobalAudiosWhilePlayItem(this.mainPlayList, 0)"},{"camera":"this.media_E7B877DF_F17E_BFDB_41D2_8F8EC283B0C6_camera","media":"this.media_E7B877DF_F17E_BFDB_41D2_8F8EC283B0C6","class":"Video360PlayListItem","player":"this.MainViewerPanoramaPlayer","begin":"this.fixTogglePlayPauseButton(this.MainViewerPanoramaPlayer); this.setEndToItemIndex(this.mainPlayList, 1, 2)","start":"this.MainViewerPanoramaPlayer.set('displayPlaybackBar', true); this.MainViewerPanoramaPlayer.set('displayPlayOverlay', false); this.MainViewerPanoramaPlayer.set('clickAction', 'none'); this.changeBackgroundWhilePlay(this.mainPlayList, 1, '#000000'); this.pauseGlobalAudiosWhilePlayItem(this.mainPlayList, 1)"},{"camera":"this.media_E7BA925A_F17E_9024_41C7_F3484DA811BA_camera","media":"this.media_E7BA925A_F17E_9024_41C7_F3484DA811BA","class":"Video360PlayListItem","end":"this.trigger('tourEnded')","player":"this.MainViewerPanoramaPlayer","begin":"this.fixTogglePlayPauseButton(this.MainViewerPanoramaPlayer); this.setEndToItemIndex(this.mainPlayList, 2, 0)","start":"this.MainViewerPanoramaPlayer.set('displayPlaybackBar', true); this.MainViewerPanoramaPlayer.set('displayPlayOverlay', false); this.MainViewerPanoramaPlayer.set('clickAction', 'none'); this.changeBackgroundWhilePlay(this.mainPlayList, 2, '#000000'); this.pauseGlobalAudiosWhilePlayItem(this.mainPlayList, 2)"}],"class":"PlayList"},{"initialPosition":{"pitch":0,"class":"RotationalCameraPosition","yaw":0,"hfov":120},"class":"RotationalCamera","id":"media_E7B877DF_F17E_BFDB_41D2_8F8EC283B0C6_camera","enterPointingToHorizon":true},{"height":1920,"posterURL":trans('videores_E9E9CE24_F176_906D_41EB_3F16EB144D78.posterURL'),"codec":"h264","bitrate":17677,"type":"video/mp4","url":trans('videores_E9E9CE24_F176_906D_41EB_3F16EB144D78.url'),"framerate":29.97,"class":"Video360Resource","id":"videores_E9E9CE24_F176_906D_41EB_3F16EB144D78","width":3840},{"data":{"hasPanoramaAction":true,"label":"Arrow 01 Left"},"enabledInVR":true,"areas":["this.HotspotPanoramaOverlayArea_E9F93D6C_F17A_F0FD_41ED_FCB3D3425D24"],"maps":[],"items":[{"pitch":-62.83,"distance":50,"yaw":-177.59,"scaleMode":"fit_inside","class":"HotspotPanoramaOverlayImage","hfov":12,"image":"this.AnimatedImageResource_E8F5F367_F156_90EC_41C5_AF82C97EFEE8","roll":-57.7,"data":{"label":"Arrow 01 Left"},"vfov":12,"playbackPositions":[{"pitch":-62.83,"class":"PanoramaOverlayPlaybackPosition","timestamp":0,"hfov":12,"roll":-57.7,"yaw":-177.59,"vfov":12}]}],"class":"HotspotPanoramaOverlay","useHandCursor":true,"id":"overlay_E99ABD34_F17A_F06D_41D7_78397ACFBE2A"},{"height":1920,"posterURL":trans('videores_EB315F2F_F16A_907B_41DE_079D0AE08B84.posterURL'),"codec":"h264","bitrate":17677,"type":"video/mp4","url":trans('videores_EB315F2F_F16A_907B_41DE_079D0AE08B84.url'),"framerate":29.97,"class":"Video360Resource","id":"videores_EB315F2F_F16A_907B_41DE_079D0AE08B84","width":3840},{"data":{"hasPanoramaAction":true,"label":"Arrow 01 Left"},"enabledInVR":true,"areas":["this.HotspotPanoramaOverlayArea_E9A6705F_F17A_70DC_4168_5980923DA611"],"maps":[],"items":[{"pitch":-69.22,"distance":50,"yaw":-119.79,"scaleMode":"fit_inside","class":"HotspotPanoramaOverlayImage","hfov":12,"image":"this.AnimatedImageResource_E8F5C368_F156_90E4_41E2_0C6C9745258A","roll":85.86,"data":{"label":"Arrow 01 Left"},"vfov":12,"playbackPositions":[{"pitch":-69.22,"class":"PanoramaOverlayPlaybackPosition","timestamp":0,"hfov":12,"roll":85.86,"yaw":-119.79,"vfov":12}]}],"class":"HotspotPanoramaOverlay","useHandCursor":true,"id":"overlay_E959E046_F17A_702C_41C3_29F55B702CB6"},{"data":{"hasPanoramaAction":true,"label":"Arrow 01 Left"},"enabledInVR":true,"areas":["this.HotspotPanoramaOverlayArea_E980356E_F17A_90FC_41D3_0767D1E23AA2"],"maps":[],"items":[{"pitch":-39.03,"distance":50,"yaw":-126.55,"scaleMode":"fit_inside","class":"HotspotPanoramaOverlayImage","hfov":6.85,"image":"this.AnimatedImageResource_E8F41368_F156_90E4_41DF_DC5AF4FD181C","roll":-74.82,"data":{"label":"Arrow 01 Left"},"vfov":9.74,"playbackPositions":[{"pitch":-39.03,"class":"PanoramaOverlayPlaybackPosition","timestamp":0,"hfov":6.85,"roll":-74.82,"yaw":-126.55,"vfov":9.74}]}],"class":"HotspotPanoramaOverlay","useHandCursor":true,"id":"overlay_E98C6565_F17A_90EC_41EB_2E344C5FBC3D"},{"height":1920,"posterURL":trans('videores_EB17A8A0_F15A_9064_41E0_536CA2EEFA98.posterURL'),"codec":"h264","bitrate":17677,"type":"video/mp4","url":trans('videores_EB17A8A0_F15A_9064_41E0_536CA2EEFA98.url'),"framerate":29.97,"class":"Video360Resource","id":"videores_EB17A8A0_F15A_9064_41E0_536CA2EEFA98","width":3840},{"data":{"hasPanoramaAction":true,"label":"Arrow 01 Left"},"enabledInVR":true,"areas":["this.HotspotPanoramaOverlayArea_E9B94E74_F175_90EC_41DD_1500E4C38277"],"maps":[],"items":[{"pitch":-40.99,"distance":50,"yaw":-78.61,"scaleMode":"fit_inside","class":"HotspotPanoramaOverlayImage","hfov":12,"image":"this.AnimatedImageResource_E8F44368_F156_90E4_41D7_5DC77C7DAC95","roll":-17.31,"data":{"label":"Arrow 01 Left"},"vfov":12,"playbackPositions":[{"pitch":-40.99,"class":"PanoramaOverlayPlaybackPosition","timestamp":0,"hfov":12,"roll":-17.31,"yaw":-78.61,"vfov":12}]}],"class":"HotspotPanoramaOverlay","useHandCursor":true,"id":"overlay_E94BBE5B_F175_9024_41C4_B089ED97F353"},{"displayTooltipInTouchScreens":true,"click":"this.setPlayListSelectedIndex(this.mainPlayList, 1); this.MainViewerPanoramaPlayer.play()","class":"HotspotPanoramaOverlayArea","id":"HotspotPanoramaOverlayArea_E9F93D6C_F17A_F0FD_41ED_FCB3D3425D24","mapColor":"any"},{"frameCount":9,"frameDuration":62,"colCount":3,"rowCount":3,"levels":[{"height":300,"url":"media/res_E9940B71_F176_90E4_41D6_6A6CD37F3D4C_0.webp","class":"ImageResourceLevel","width":300}],"class":"AnimatedImageResource","id":"AnimatedImageResource_E8F5F367_F156_90EC_41C5_AF82C97EFEE8","finalFrame":"first"},{"displayTooltipInTouchScreens":true,"click":"this.setPlayListSelectedIndex(this.mainPlayList, 2); this.MainViewerPanoramaPlayer.play()","class":"HotspotPanoramaOverlayArea","id":"HotspotPanoramaOverlayArea_E9A6705F_F17A_70DC_4168_5980923DA611","mapColor":"any"},{"frameCount":9,"frameDuration":62,"colCount":3,"rowCount":3,"levels":[{"height":300,"url":"media/res_E9940B71_F176_90E4_41D6_6A6CD37F3D4C_0.webp","class":"ImageResourceLevel","width":300}],"class":"AnimatedImageResource","id":"AnimatedImageResource_E8F5C368_F156_90E4_41E2_0C6C9745258A","finalFrame":"first"},{"displayTooltipInTouchScreens":true,"click":"this.setPlayListSelectedIndex(this.mainPlayList, 0); this.MainViewerPanoramaPlayer.play()","class":"HotspotPanoramaOverlayArea","id":"HotspotPanoramaOverlayArea_E980356E_F17A_90FC_41D3_0767D1E23AA2","mapColor":"any"},{"frameCount":9,"frameDuration":62,"colCount":3,"rowCount":3,"levels":[{"height":300,"url":"media/res_E9940B71_F176_90E4_41D6_6A6CD37F3D4C_0.webp","class":"ImageResourceLevel","width":300}],"class":"AnimatedImageResource","id":"AnimatedImageResource_E8F41368_F156_90E4_41DF_DC5AF4FD181C","finalFrame":"first"},{"displayTooltipInTouchScreens":true,"click":"this.setPlayListSelectedIndex(this.mainPlayList, 0); this.MainViewerPanoramaPlayer.play()","class":"HotspotPanoramaOverlayArea","id":"HotspotPanoramaOverlayArea_E9B94E74_F175_90EC_41DD_1500E4C38277","mapColor":"any"},{"frameCount":9,"frameDuration":62,"colCount":3,"rowCount":3,"levels":[{"height":300,"url":"media/res_E9940B71_F176_90E4_41D6_6A6CD37F3D4C_0.webp","class":"ImageResourceLevel","width":300}],"class":"AnimatedImageResource","id":"AnimatedImageResource_E8F44368_F156_90E4_41D7_5DC77C7DAC95","finalFrame":"first"}],"class":"Player","data":{"displayTooltipInTouchScreens":true,"history":{},"locales":{"en":"locale/en.txt"},"defaultLocale":"en","name":"Player22103","textToSpeechConfig":{"pitch":1,"speechOnInfoWindow":false,"volume":1,"speechOnQuizQuestion":false,"speechOnTooltip":false,"stopBackgroundAudio":false,"rate":1}},"propagateClick":false,"scrollBarMargin":2,"start":"this.init()","defaultMenu":["fullscreen","mute","rotation"],"id":"rootPlayer","backgroundColor":["#FFFFFF"],"layout":"absolute","minHeight":0,"xrPanelsEnabled":true,"minWidth":0,"backgroundColorRatios":[0],"gap":10,"scripts":{"historyGoBack":TDV.Tour.Script.historyGoBack,"createTweenModel3D":TDV.Tour.Script.createTweenModel3D,"historyGoForward":TDV.Tour.Script.historyGoForward,"showPopupImage":TDV.Tour.Script.showPopupImage,"downloadFile":TDV.Tour.Script.downloadFile,"showPopupPanoramaOverlay":TDV.Tour.Script.showPopupPanoramaOverlay,"getRootOverlay":TDV.Tour.Script.getRootOverlay,"getStateTextToSpeech":TDV.Tour.Script.getStateTextToSpeech,"getQuizTotalObjectiveProperty":TDV.Tour.Script.getQuizTotalObjectiveProperty,"clone":TDV.Tour.Script.clone,"getPlayListItemIndexByMedia":TDV.Tour.Script.getPlayListItemIndexByMedia,"copyToClipboard":TDV.Tour.Script.copyToClipboard,"openLink":TDV.Tour.Script.openLink,"getPlayListItemByMedia":TDV.Tour.Script.getPlayListItemByMedia,"resumeGlobalAudios":TDV.Tour.Script.resumeGlobalAudios,"showPopupMedia":TDV.Tour.Script.showPopupMedia,"quizResumeTimer":TDV.Tour.Script.quizResumeTimer,"getPlayListItems":TDV.Tour.Script.getPlayListItems,"quizPauseTimer":TDV.Tour.Script.quizPauseTimer,"showComponentsWhileMouseOver":TDV.Tour.Script.showComponentsWhileMouseOver,"getFirstPlayListWithMedia":TDV.Tour.Script.getFirstPlayListWithMedia,"copyObjRecursively":TDV.Tour.Script.copyObjRecursively,"shareSocial":TDV.Tour.Script.shareSocial,"enableVR":TDV.Tour.Script.enableVR,"skip3DTransitionOnce":TDV.Tour.Script.skip3DTransitionOnce,"setValue":TDV.Tour.Script.setValue,"toggleVR":TDV.Tour.Script.toggleVR,"getPlayListWithItem":TDV.Tour.Script.getPlayListWithItem,"cloneBindings":TDV.Tour.Script.cloneBindings,"disableVR":TDV.Tour.Script.disableVR,"clonePanoramaCamera":TDV.Tour.Script.clonePanoramaCamera,"_getPlayListsWithViewer":TDV.Tour.Script._getPlayListsWithViewer,"getPixels":TDV.Tour.Script.getPixels,"setStartTimeVideoSync":TDV.Tour.Script.setStartTimeVideoSync,"setStartTimeVideo":TDV.Tour.Script.setStartTimeVideo,"changePlayListWithSameSpot":TDV.Tour.Script.changePlayListWithSameSpot,"getKey":TDV.Tour.Script.getKey,"visibleComponentsIfPlayerFlagEnabled":TDV.Tour.Script.visibleComponentsIfPlayerFlagEnabled,"updateMediaLabelFromPlayList":TDV.Tour.Script.updateMediaLabelFromPlayList,"setMapLocation":TDV.Tour.Script.setMapLocation,"getMainViewer":TDV.Tour.Script.getMainViewer,"playGlobalAudio":TDV.Tour.Script.playGlobalAudio,"quizShowQuestion":TDV.Tour.Script.quizShowQuestion,"getPanoramaOverlayByName":TDV.Tour.Script.getPanoramaOverlayByName,"updateIndexGlobalZoomImage":TDV.Tour.Script.updateIndexGlobalZoomImage,"getPanoramaOverlaysByTags":TDV.Tour.Script.getPanoramaOverlaysByTags,"getOverlaysByGroupname":TDV.Tour.Script.getOverlaysByGroupname,"playGlobalAudioWhilePlay":TDV.Tour.Script.playGlobalAudioWhilePlay,"setSurfaceSelectionHotspotMode":TDV.Tour.Script.setSurfaceSelectionHotspotMode,"getOverlaysByTags":TDV.Tour.Script.getOverlaysByTags,"playGlobalAudioWhilePlayActiveMedia":TDV.Tour.Script.playGlobalAudioWhilePlayActiveMedia,"setPlayListSelectedIndex":TDV.Tour.Script.setPlayListSelectedIndex,"updateDeepLink":TDV.Tour.Script.updateDeepLink,"getOverlays":TDV.Tour.Script.getOverlays,"changeOpacityWhilePlay":TDV.Tour.Script.changeOpacityWhilePlay,"unloadViewer":TDV.Tour.Script.unloadViewer,"changeBackgroundWhilePlay":TDV.Tour.Script.changeBackgroundWhilePlay,"setPanoramaCameraWithSpot":TDV.Tour.Script.setPanoramaCameraWithSpot,"fixTogglePlayPauseButton":TDV.Tour.Script.fixTogglePlayPauseButton,"setPanoramaCameraWithCurrentSpot":TDV.Tour.Script.setPanoramaCameraWithCurrentSpot,"autotriggerAtStart":TDV.Tour.Script.autotriggerAtStart,"pauseGlobalAudios":TDV.Tour.Script.pauseGlobalAudios,"_getObjectsByTags":TDV.Tour.Script._getObjectsByTags,"playAudioList":TDV.Tour.Script.playAudioList,"init":TDV.Tour.Script.init,"getModel3DInnerObject":TDV.Tour.Script.getModel3DInnerObject,"pauseGlobalAudiosWhilePlayItem":TDV.Tour.Script.pauseGlobalAudiosWhilePlayItem,"triggerOverlay":TDV.Tour.Script.triggerOverlay,"getMediaHeight":TDV.Tour.Script.getMediaHeight,"textToSpeechComponent":TDV.Tour.Script.textToSpeechComponent,"pauseGlobalAudio":TDV.Tour.Script.pauseGlobalAudio,"toggleTextToSpeechComponent":TDV.Tour.Script.toggleTextToSpeechComponent,"setOverlaysVisibilityByTags":TDV.Tour.Script.setOverlaysVisibilityByTags,"updateVideoCues":TDV.Tour.Script.updateVideoCues,"pauseCurrentPlayers":TDV.Tour.Script.pauseCurrentPlayers,"getMediaWidth":TDV.Tour.Script.getMediaWidth,"setOverlaysVisibility":TDV.Tour.Script.setOverlaysVisibility,"assignObjRecursively":TDV.Tour.Script.assignObjRecursively,"setOverlayBehaviour":TDV.Tour.Script.setOverlayBehaviour,"mixObject":TDV.Tour.Script.mixObject,"quizSetItemFound":TDV.Tour.Script.quizSetItemFound,"getMediaFromPlayer":TDV.Tour.Script.getMediaFromPlayer,"syncPlaylists":TDV.Tour.Script.syncPlaylists,"setDirectionalPanoramaAudio":TDV.Tour.Script.setDirectionalPanoramaAudio,"getComponentsByTags":TDV.Tour.Script.getComponentsByTags,"setObjectsVisibilityByTags":TDV.Tour.Script.setObjectsVisibilityByTags,"setObjectsVisibility":TDV.Tour.Script.setObjectsVisibility,"setObjectsVisibilityByID":TDV.Tour.Script.setObjectsVisibilityByID,"getMediaByTags":TDV.Tour.Script.getMediaByTags,"loadFromCurrentMediaPlayList":TDV.Tour.Script.loadFromCurrentMediaPlayList,"getMediaByName":TDV.Tour.Script.getMediaByName,"_initTTSTooltips":TDV.Tour.Script._initTTSTooltips,"getPlayListsWithMedia":TDV.Tour.Script.getPlayListsWithMedia,"stopAndGoCamera":TDV.Tour.Script.stopAndGoCamera,"setModel3DCameraSpot":TDV.Tour.Script.setModel3DCameraSpot,"_initItemWithComps":TDV.Tour.Script._initItemWithComps,"setModel3DCameraWithCurrentSpot":TDV.Tour.Script.setModel3DCameraWithCurrentSpot,"takeScreenshot":TDV.Tour.Script.takeScreenshot,"setMediaBehaviour":TDV.Tour.Script.setMediaBehaviour,"setModel3DCameraSequence":TDV.Tour.Script.setModel3DCameraSequence,"quizShowTimeout":TDV.Tour.Script.quizShowTimeout,"openEmbeddedPDF":TDV.Tour.Script.openEmbeddedPDF,"getGlobalAudio":TDV.Tour.Script.getGlobalAudio,"keepCompVisible":TDV.Tour.Script.keepCompVisible,"quizShowScore":TDV.Tour.Script.quizShowScore,"setMeasurementUnits":TDV.Tour.Script.setMeasurementUnits,"getCurrentPlayers":TDV.Tour.Script.getCurrentPlayers,"cleanSelectedMeasurements":TDV.Tour.Script.cleanSelectedMeasurements,"setMainMediaByName":TDV.Tour.Script.setMainMediaByName,"setMeasurementsVisibility":TDV.Tour.Script.setMeasurementsVisibility,"getCurrentPlayerWithMedia":TDV.Tour.Script.getCurrentPlayerWithMedia,"isPanorama":TDV.Tour.Script.isPanorama,"setMainMediaByIndex":TDV.Tour.Script.setMainMediaByIndex,"getAudioByTags":TDV.Tour.Script.getAudioByTags,"getComponentByName":TDV.Tour.Script.getComponentByName,"toggleMeasurementsVisibility":TDV.Tour.Script.toggleMeasurementsVisibility,"cleanAllMeasurements":TDV.Tour.Script.cleanAllMeasurements,"getActivePlayersWithViewer":TDV.Tour.Script.getActivePlayersWithViewer,"quizStart":TDV.Tour.Script.quizStart,"setEndToItemIndex":TDV.Tour.Script.setEndToItemIndex,"createTween":TDV.Tour.Script.createTween,"getActivePlayerWithViewer":TDV.Tour.Script.getActivePlayerWithViewer,"_initTwinsViewer":TDV.Tour.Script._initTwinsViewer,"restartTourWithoutInteraction":TDV.Tour.Script.restartTourWithoutInteraction,"setComponentsVisibilityByTags":TDV.Tour.Script.setComponentsVisibilityByTags,"_initSplitViewer":TDV.Tour.Script._initSplitViewer,"isCardboardViewMode":TDV.Tour.Script.isCardboardViewMode,"toggleMeasurement":TDV.Tour.Script.toggleMeasurement,"setComponentVisibility":TDV.Tour.Script.setComponentVisibility,"initQuiz":TDV.Tour.Script.initQuiz,"getActiveMediaWithViewer":TDV.Tour.Script.getActiveMediaWithViewer,"stopMeasurement":TDV.Tour.Script.stopMeasurement,"setCameraSameSpotAsMedia":TDV.Tour.Script.setCameraSameSpotAsMedia,"initOverlayGroupRotationOnClick":TDV.Tour.Script.initOverlayGroupRotationOnClick,"sendAnalyticsData":TDV.Tour.Script.sendAnalyticsData,"initAnalytics":TDV.Tour.Script.initAnalytics,"startMeasurement":TDV.Tour.Script.startMeasurement,"executeFunctionWhenChange":TDV.Tour.Script.executeFunctionWhenChange,"startPanoramaWithModel":TDV.Tour.Script.startPanoramaWithModel,"stopGlobalAudio":TDV.Tour.Script.stopGlobalAudio,"translate":TDV.Tour.Script.translate,"stopTextToSpeech":TDV.Tour.Script.stopTextToSpeech,"executeJS":TDV.Tour.Script.executeJS,"startPanoramaWithCamera":TDV.Tour.Script.startPanoramaWithCamera,"quizFinish":TDV.Tour.Script.quizFinish,"executeAudioActionByTags":TDV.Tour.Script.executeAudioActionByTags,"isComponentVisible":TDV.Tour.Script.isComponentVisible,"stopGlobalAudios":TDV.Tour.Script.stopGlobalAudios,"executeAudioAction":TDV.Tour.Script.executeAudioAction,"showWindowBase":TDV.Tour.Script.showWindowBase,"existsKey":TDV.Tour.Script.existsKey,"startModel3DWithCameraSpot":TDV.Tour.Script.startModel3DWithCameraSpot,"textToSpeech":TDV.Tour.Script.textToSpeech,"setLocale":TDV.Tour.Script.setLocale,"unregisterKey":TDV.Tour.Script.unregisterKey,"htmlToPlainText":TDV.Tour.Script.htmlToPlainText,"resumePlayers":TDV.Tour.Script.resumePlayers,"showPopupPanoramaVideoOverlay":TDV.Tour.Script.showPopupPanoramaVideoOverlay,"registerKey":TDV.Tour.Script.registerKey,"showWindow":TDV.Tour.Script.showWindow},"width":"100%","scrollBarColor":"#000000","height":"100%"};
if (script['data'] == undefined)
    script['data'] = {};
script['data']['translateObjs'] = translateObjs, script['data']['createQuizConfig'] = function () {
    let a = {}, b = this['get']('data')['translateObjs'];
    for (const c in translateObjs) {
        if (!b['hasOwnProperty'](c))
            b[c] = translateObjs[c];
    }
    return a;
}, TDV['PlayerAPI']['defineScript'](script);
//# sourceMappingURL=script_device.js.map
})();
//Generated with v2026.0.4, Sun Mar 15 2026